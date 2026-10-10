"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  BookOpen,
  Sparkles,
  FileText,
  Upload,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  User,
  Tag,
  Download,
  Share2,
  ThumbsUp,
  MessageSquare,
  Clock,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Eye,
  Trash2,
  FolderDown,
  Paperclip,
  Pencil,
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  ChevronDown,
  Check
} from "lucide-react";
import ExportDataDropdown from "./ExportDataDropdown";
import { getCloudJson, setCloudJson, CLOUD_KEYS } from "@/utils/cloudSyncService";

interface AiNewsItem {
  id: string;
  month: string;
  title: string;
  summary: string;
  category: "Design" | "PR" | "Content";
  source: string;
  url: string;
  publishedDate: string;
  readTime: string;
  keyTakeaway: string;
}

interface StaffArticle {
  id: string;
  title: string;
  author: string;
  authorNickname: string;
  unit: string;
  category: string;
  content: string;
  readCount: number;
  publishedAt: string;
  tags: string[];
}

interface KmFileItem {
  id: string;
  name: string;
  category: string;
  size: string;
  format: string;
  uploader: string;
  uploadedAt: string;
  downloadCount: number;
  url: string;
}

export const ARTICLE_CATEGORIES = [
  { id: "Content", label: "Content", icon: "✍️", desc: "บทความ, งานเขียน, สตอรี่บอร์ด และงานเนื้อหา" },
  { id: "Creative", label: "Creative", icon: "🎨", desc: "แนวคิดสร้างสรรค์, Art Direction และ Moodboard" },
  { id: "Idea", label: "Idea", icon: "💡", desc: "ไอเดียใหม่, นวัตกรรมการสื่อสาร และแนวคิดต่อยอด" },
  { id: "Graphic & Branding", label: "Graphic & Branding", icon: "🏷️", desc: "งานกราฟิก, แบรนดิ้ง, CI และภาพลักษณ์องค์กร" },
  { id: "Corporate PR", label: "Corporate PR", icon: "📢", desc: "การประชาสัมพันธ์, ข่าวสาร และสื่อสารองค์กร" },
  { id: "Video Production", label: "Video Production", icon: "🎬", desc: "การผลิตวิดีโอ, คลิปสั้น, โมชัน และเสียง" },
  { id: "GenAI & Tools", label: "GenAI & Tools", icon: "🤖", desc: "เครื่องมือดิจิทัล, AI Prompt และเทคโนโลยีใหม่" },
  { id: "Work Process & WI", label: "Work Process & WI", icon: "📋", desc: "ขั้นตอนการทำงาน, SOP และมาตรฐานการบริการ" },
  { id: "custom", label: "อื่นๆ (ระบุหัวข้อเอง...)", icon: "➕", desc: "กำหนดหมวดหมู่ หรือหัวข้อของคุณเองได้อย่างอิสระ" }
];

export const STAFF_AUTHORS = [
  { nickname: "จอย RL", name: "นางสาวรติพร กัลปพฤกษ์", unit: "ยูนิตงานออกแบบ (Creative Designer)", icon: "🎨" },
  { nickname: "พิม AC", name: "นางสาวพิมพ์ชนก อริยวรพงศ์", unit: "ยูนิตงานออกแบบ (Creative Designer)", icon: "🎨" },
  { nickname: "ก้อง IK", name: "นายก้องภพ อินต๊ะคำ", unit: "ยูนิตงานออกแบบ (Creative Designer)", icon: "🎨" },
  { nickname: "ลูกอิน STK", name: "นางสาวสุทธิอาภา คุ้มครอง", unit: "ยูนิตสื่อสารองค์กร (PR Officer)", icon: "📢" },
  { nickname: "โอ๊ต CNB", name: "นายกฤษณะ ชนะบวร", unit: "ยูนิตสื่อสารองค์กร (PR Officer)", icon: "📢" },
  { nickname: "เอ็นจอย SLR", name: "นางสาวศิริลักษณ์ กันจะนะ", unit: "ยูนิตผลิตสื่อสร้างสรรค์ (Content Creator)", icon: "🎬" },
  { nickname: "แก้ว KYK", name: "นางสาวกัลยกร คำยอง", unit: "ยูนิตผลิตสื่อสร้างสรรค์ (Content Creator)", icon: "🎬" },
  { nickname: "ต้า TTY", name: "นายธนวัฒน์ ทิพย์ยอด", unit: "ยูนิตผลิตสื่อสร้างสรรค์ (Content Creator)", icon: "🎬" },
  { nickname: "จ๊อบ AA", name: "นายอัครวุฒิ อมรศักดิ์", unit: "บริหารทีม (Team Leader)", icon: "💼" },
  { nickname: "วา WK", name: "นางสาววาสิตา คชสาร", unit: "บริหารทีม (Assistant Leader)", icon: "📋" },
  { nickname: "ทีม CC", name: "ทีมงาน CC ส่วนกลาง", unit: "ส่วนกลางงานสร้างสรรค์และสื่อสาร", icon: "👥" }
];

const DEFAULT_AI_NEWS: AiNewsItem[] = [
  // =========================================================================
  // ตุลาคม 2026: ครบ 3 ข่าวเด่น ออกแบบ • PR • Content (อัปเดตทุกวันที่ 1 ของเดือน)
  // =========================================================================
  {
    id: "ai-news-m10-design",
    month: "ตุลาคม 2026",
    title: "AI-Native Design & Variable Design Tokens: ยกระดับมาตรฐานการออกแบบข้ามแพลตฟอร์ม 2026",
    summary: "Figma และสตูดิโอออกแบบชั้นนำอัปเดตแนวทาง Design Systems ยุคใหม่ ผสาน AI-assisted Tokens ช่วยแปลง Key Visual และ Component อัตโนมัติ ลดเวลาทำงานกราฟิกซ้ำซ้อนและรักษาอัตลักษณ์องค์กรได้อย่างแม่นยำ",
    category: "Design",
    source: "Figma Official Blog",
    url: "https://www.figma.com/blog/",
    publishedDate: "1 ต.ค. 2026",
    readTime: "4 นาที",
    keyTakeaway: "ทีมงานออกแบบ (Creative Designer) สามารถนำระบบ Design Tokens ไปใช้ใน Master Template เพื่อสร้างกราฟิกสำหรับสื่อดิจิทัลและงานพิมพ์ได้อย่างรวดเร็วและเป็นเอกภาพ"
  },
  {
    id: "ai-news-m10-pr",
    month: "ตุลาคม 2026",
    title: "Data-Driven Crisis Management & AI Fact-Checking: กลยุทธ์สื่อสารองค์กรยุคข้อมูลสังเคราะห์",
    summary: "สมาคมการประชาสัมพันธ์แห่งสหรัฐอเมริกา (PRSA) แนะนำกรอบการทำงานสื่อสารองค์กรยุคใหม่ เน้นการตรวจพิสูจน์ข้อเท็จจริง (Fact-Checking) และวิเคราะห์ความรู้สึกสื่อ (Sentiment Monitoring) เพื่อปกป้องชื่อเสียงองค์กรอย่างทันท่วงที",
    category: "PR",
    source: "PRSA (Public Relations Society of America)",
    url: "https://www.prsa.org/",
    publishedDate: "1 ต.ค. 2026",
    readTime: "5 นาที",
    keyTakeaway: "ทีมสื่อสารองค์กร (PR Officer) นำเครื่องมือตรวจสอบและสูตรวัด Sentiment ไปประยุกต์ใช้ในการเผยแพร่ข่าวความร่วมมือวิจัยและรายงานผลต่อผู้มีส่วนได้ส่วนเสีย"
  },
  {
    id: "ai-news-m10-content",
    month: "ตุลาคม 2026",
    title: "Multimodal Video Generation & AI Prompt Crafting: การผลิตสื่อวิดีโอสั้นและ Storytelling ระดับพรีเมียม",
    summary: "การพัฒนาของโมเดลวิดีโอและมัลติมีเดียช่วยให้ครีเอเตอร์สามารถแปลงบทความหรือรายงานวิจัยให้กลายเป็น Storyboard และ Video Clip สั้นได้อย่างลื่นไหล รองรับการเผยแพร่บน Social Media และจอประชาสัมพันธ์องค์กร",
    category: "Content",
    source: "OpenAI Research & News",
    url: "https://openai.com/news/",
    publishedDate: "1 ต.ค. 2026",
    readTime: "4 นาที",
    keyTakeaway: "ทีมผลิตสื่อสร้างสรรค์ (Content Creator) สามารถนำเครื่องมือสร้างภาพและตัดต่อด้วย AI มาช่วยจำลองตัวอย่างคลิปวิดีโอสัมภาษณ์และคลิปเล่าเรื่องงานนวัตกรรมได้อย่างรวดเร็ว"
  }
];

const DEFAULT_STAFF_ARTICLES: StaffArticle[] = [];

const DEFAULT_KM_FILES: KmFileItem[] = [];

export default function KmReportDetail() {
  const [activeTab, setActiveTab] = useState<"ai-trends" | "articles" | "files">("ai-trends");
  const [aiNews, setAiNews] = useState<AiNewsItem[]>(DEFAULT_AI_NEWS);
  const [articles, setArticles] = useState<StaffArticle[]>([]);
  const [files, setFiles] = useState<KmFileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [aiCategoryFilter, setAiCategoryFilter] = useState<string>("ALL");
  const [aiSearchQuery, setAiSearchQuery] = useState<string>("");

  // User identity & permission state
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "assignee">("admin");
  const [activeKmUser, setActiveKmUser] = useState<string>("Admin");

  // Article creation modal state
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("จอย RL");
  const [newCategory, setNewCategory] = useState("Creative");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");

  // Custom dropdown states for New Article Modal
  const [isNewAuthorDropdownOpen, setIsNewAuthorDropdownOpen] = useState(false);
  const [isNewCategoryDropdownOpen, setIsNewCategoryDropdownOpen] = useState(false);
  const [isNewCustomCategory, setIsNewCustomCategory] = useState(false);
  const [newCustomCategoryInput, setNewCustomCategoryInput] = useState("");
  const newAuthorDropdownRef = useRef<HTMLDivElement>(null);
  const newCategoryDropdownRef = useRef<HTMLDivElement>(null);

  // Article edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<StaffArticle | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("จอย RL");
  const [editCategory, setEditCategory] = useState("Graphic & Branding");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");

  // Custom dropdown states for Edit Article Modal
  const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const authorDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Article delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<StaffArticle | null>(null);

  // File edit modal state
  const [showEditFileModal, setShowEditFileModal] = useState(false);
  const [editingFile, setEditingFile] = useState<KmFileItem | null>(null);
  const [editFileName, setEditFileName] = useState("");
  const [editFileCategory, setEditFileCategory] = useState("Graphic Template");
  const [editFileSize, setEditFileSize] = useState("");
  const [editFileUploader, setEditFileUploader] = useState("จ๊อบ AA");

  // File delete modal state
  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [deletingFile, setDeletingFile] = useState<KmFileItem | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File upload modal state
  const [showFileModal, setShowFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileCategory, setNewFileCategory] = useState("Graphic Template");
  const [newFileUploader, setNewFileUploader] = useState("ทีม CC");

  // Article reader modal state
  const [readingArticle, setReadingArticle] = useState<StaffArticle | null>(null);
  const [likedArticles, setLikedArticles] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Staff helpers
  const getStaffFullName = (nickname: string) => {
    switch (nickname) {
      case "จอย RL":
        return "นางสาวรติพร กัลปพฤกษ์";
      case "ลูกอิน STK":
        return "นางสาวสุทธิอาภา คุ้มครอง";
      case "เอ็นจอย SLR":
        return "นางสาวศิริลักษณ์ กันจะนะ";
      case "พิม AC":
        return "นางสาวพิมพ์ชนก อริยวรพงศ์";
      case "โอ๊ต CNB":
        return "นายกฤษณะ ชนะบวร";
      case "แก้ว KYK":
        return "นางสาวกัลยกร คำยอง";
      case "ต้า TTY":
        return "นายธนวัฒน์ ทิพย์ยอด";
      case "จ๊อบ AA":
        return "นายอัครวุฒิ อมรศักดิ์";
      case "วา WK":
        return "นางสาววาสิตา คชสาร";
      default:
        return "ทีมงานสร้างสรรค์ CC";
    }
  };

  const getStaffUnit = (nickname: string) => {
    switch (nickname) {
      case "จอย RL":
      case "พิม AC":
        return "ยูนิตงานออกแบบ (Creative Designer)";
      case "ลูกอิน STK":
      case "โอ๊ต CNB":
        return "ยูนิตสื่อสารองค์กร (PR Officer)";
      case "เอ็นจอย SLR":
      case "แก้ว KYK":
      case "ต้า TTY":
        return "ยูนิตผลิตสื่อสร้างสรรค์ (Content Creator)";
      case "จ๊อบ AA":
        return "บริหารทีม (Team Leader)";
      case "วา WK":
        return "บริหารทีม (Assistant Leader)";
      default:
        return "ยูนิตงานสร้างสรรค์และสื่อสาร CC";
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleSwitchKmUser = (userVal: string) => {
    setActiveKmUser(userVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_km_active_user", userVal);
    }
    showToast(`สลับโหมดผู้ใช้งาน: ${userVal}`);
  };

  // Permission check: only author or admin can edit/delete
  const canModifyArticle = (art: StaffArticle) => {
    // 1. Admin role (from global cc_user_role or active persona)
    if (currentUserRole === "admin" || activeKmUser === "Admin" || activeKmUser === "admin") {
      return true;
    }
    // 2. Author matching active persona
    if (activeKmUser && (activeKmUser === art.authorNickname || activeKmUser === art.author)) {
      return true;
    }
    return false;
  };

  // Open article to read
  const handleOpenArticle = (art: StaffArticle) => {
    const updated = articles.map(a => {
      if (a.id === art.id) {
        return { ...a, readCount: (a.readCount || 0) + 1 };
      }
      return a;
    });
    setArticles(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_km_staff_articles_v3_fy70", JSON.stringify(updated));
    }
    setReadingArticle({ ...art, readCount: (art.readCount || 0) + 1 });
  };

  const handleToggleLike = (id: string) => {
    setLikedArticles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyArticleLink = (art: StaffArticle) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/dashboard?view=data-reports&report=km&article=${art.id}`);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  };

  const handleStartEditArticle = (art: StaffArticle) => {
    if (!canModifyArticle(art)) {
      alert(`คุณไม่มีสิทธิ์แก้ไขบทความนี้\n(สิทธิ์เฉพาะผู้เขียน: ${art.authorNickname} หรือ Admin เท่านั้น)`);
      return;
    }
    setEditingArticle(art);
    setEditTitle(art.title);
    setEditAuthor(art.authorNickname);

    // Check if category is one of the predefined categories (excluding "custom")
    const foundCat = ARTICLE_CATEGORIES.find(
      c => c.id !== "custom" && c.id.toLowerCase() === (art.category || "").toLowerCase()
    );
    if (foundCat) {
      setIsCustomCategory(false);
      setEditCategory(foundCat.id);
      setCustomCategoryInput("");
    } else {
      setIsCustomCategory(true);
      setEditCategory(art.category || "Idea");
      setCustomCategoryInput(art.category || "");
    }

    setEditContent(art.content);
    setEditTags(art.tags.join(", "));
    setIsAuthorDropdownOpen(false);
    setIsCategoryDropdownOpen(false);
    setShowEditModal(true);
  };

  const handleSaveEditedArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    if (!editTitle.trim() || !editContent.trim()) {
      alert("กรุณากรอกหัวข้อและเนื้อหาบทความ");
      return;
    }

    const finalCategory = isCustomCategory
      ? (customCategoryInput.trim() || editCategory || "Idea")
      : (editCategory || "Graphic & Branding");

    const updated = articles.map(a => {
      if (a.id === editingArticle.id) {
        return {
          ...a,
          title: editTitle.trim(),
          category: finalCategory,
          content: editContent.trim(),
          authorNickname: editAuthor,
          author: getStaffFullName(editAuthor),
          unit: getStaffUnit(editAuthor),
          tags: editTags.split(",").map(t => t.trim()).filter(Boolean)
        };
      }
      return a;
    });

    setArticles(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_km_staff_articles_v3_fy70", JSON.stringify(updated));
    }

    if (readingArticle && readingArticle.id === editingArticle.id) {
      setReadingArticle({
        ...readingArticle,
        title: editTitle.trim(),
        category: finalCategory,
        content: editContent.trim(),
        authorNickname: editAuthor,
        author: getStaffFullName(editAuthor),
        unit: getStaffUnit(editAuthor),
        tags: editTags.split(",").map(t => t.trim()).filter(Boolean)
      });
    }

    setShowEditModal(false);
    setEditingArticle(null);
    showToast("✏️ บันทึกการแก้ไขบทความเรียบร้อยแล้ว");
  };

  const handleStartDeleteArticle = (art: StaffArticle) => {
    if (!canModifyArticle(art)) {
      alert(`คุณไม่มีสิทธิ์ลบบทความนี้\n(สิทธิ์เฉพาะผู้เขียน: ${art.authorNickname} หรือ Admin เท่านั้น)`);
      return;
    }
    setDeletingArticle(art);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteArticle = () => {
    if (!deletingArticle) return;
    const deletedTitle = deletingArticle.title;
    const updated = articles.filter(a => a.id !== deletingArticle.id);
    setArticles(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_km_staff_articles_v3_fy70", JSON.stringify(updated));
    }

    if (readingArticle && readingArticle.id === deletingArticle.id) {
      setReadingArticle(null);
    }

    setShowDeleteModal(false);
    setDeletingArticle(null);
    showToast(`🗑️ ลบบทความ "${deletedTitle.slice(0, 25)}..." เรียบร้อยแล้ว`);
  };

  const handleResetDefaultArticles = () => {
    if (confirm("ต้องการรีเซ็ตบทความทั้งหมดกลับเป็นค่าเริ่มต้น 3 บทความหรือไม่?")) {
      setArticles(DEFAULT_STAFF_ARTICLES);
      if (typeof window !== "undefined") {
        localStorage.setItem("cc_km_staff_articles_v3_fy70", JSON.stringify(DEFAULT_STAFF_ARTICLES));
      }
      showToast("🔄 รีเซ็ตบทความเริ่มต้นเรียบร้อยแล้ว");
    }
  };

  // Permission check for files: only uploader or admin can edit/delete
  const canModifyFile = (file: KmFileItem) => {
    // 1. Admin role (from global cc_user_role or active persona)
    if (currentUserRole === "admin" || activeKmUser === "Admin" || activeKmUser === "admin") {
      return true;
    }
    // 2. Uploader matching active persona
    if (activeKmUser && activeKmUser === file.uploader) {
      return true;
    }
    return false;
  };

  const handleStartEditFile = (file: KmFileItem) => {
    if (!canModifyFile(file)) {
      alert(`คุณไม่มีสิทธิ์แก้ไขไฟล์นี้\n(สิทธิ์เฉพาะผู้อัปโหลด: ${file.uploader} หรือ Admin เท่านั้น)`);
      return;
    }
    setEditingFile(file);
    setEditFileName(file.name);
    setEditFileCategory(file.category);
    setEditFileSize(file.size);
    setEditFileUploader(file.uploader);
    setShowEditFileModal(true);
  };

  const handleSaveEditedFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;
    if (!editFileName.trim()) {
      alert("กรุณาระบุชื่อไฟล์");
      return;
    }

    const ext = editFileName.includes(".") ? editFileName.split(".").pop()?.toUpperCase() || "FILE" : "FILE";
    const updated = files.map(f => {
      if (f.id === editingFile.id) {
        return {
          ...f,
          name: editFileName.trim(),
          category: editFileCategory,
          size: editFileSize.trim() || f.size,
          format: ext,
          uploader: editFileUploader
        };
      }
      return f;
    });

    setFiles(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_km_files_v2_fy70", JSON.stringify(updated));
    }

    setShowEditFileModal(false);
    setEditingFile(null);
    showToast("✏️ บันทึกการแก้ไขข้อมูลไฟล์เรียบร้อยแล้ว");
  };

  const handleStartDeleteFile = (file: KmFileItem) => {
    if (!canModifyFile(file)) {
      alert(`คุณไม่มีสิทธิ์ลบไฟล์นี้\n(สิทธิ์เฉพาะผู้อัปโหลด: ${file.uploader} หรือ Admin เท่านั้น)`);
      return;
    }
    setDeletingFile(file);
    setShowDeleteFileModal(true);
  };

  const handleConfirmDeleteFile = () => {
    if (!deletingFile) return;
    const deletedName = deletingFile.name;
    const updated = files.filter(f => f.id !== deletingFile.id);
    setFiles(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_km_files_v2_fy70", JSON.stringify(updated));
    }

    setShowDeleteFileModal(false);
    setDeletingFile(null);
    showToast(`🗑️ ลบไฟล์ "${deletedName}" เรียบร้อยแล้ว`);
  };

  const handleResetDefaultFiles = () => {
    if (confirm("ต้องการรีเซ็ตคลังไฟล์ทั้งหมดกลับเป็นค่าเริ่มต้น 4 รายการหรือไม่?")) {
      setFiles(DEFAULT_KM_FILES);
      if (typeof window !== "undefined") {
        localStorage.setItem("cc_km_files_v2_fy70", JSON.stringify(DEFAULT_KM_FILES));
      }
      showToast("🔄 รีเซ็ตคลังไฟล์เริ่มต้นเรียบร้อยแล้ว");
    }
  };

  const handleDownloadFile = (file: KmFileItem) => {
    const updated = files.map(f => {
      if (f.id === file.id) {
        return { ...f, downloadCount: (f.downloadCount || 0) + 1 };
      }
      return f;
    });
    setFiles(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_km_files_v2_fy70", JSON.stringify(updated));
    }
    showToast(`📥 ดาวน์โหลดไฟล์ ${file.name} สำเร็จ`);
  };

  // Load from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("cc_user_role");
      if (savedRole === "admin" || savedRole === "assignee") {
        setCurrentUserRole(savedRole);
      }
      const savedKmUser = localStorage.getItem("cc_km_active_user");
      if (savedKmUser) {
        setActiveKmUser(savedKmUser);
      } else {
        setActiveKmUser(savedRole === "admin" ? "Admin" : "จอย RL");
      }

      // Load articles & files from Supabase cloud database
      getCloudJson<StaffArticle[]>(CLOUD_KEYS.KM_DATA, "cc_km_staff_articles_v3_fy70").then(data => {
        if (data && Array.isArray(data)) {
          setArticles(data);
        }
      });
      getCloudJson<KmFileItem[]>(CLOUD_KEYS.KM_FILES, "cc_km_files_v2_fy70").then(data => {
        if (data && Array.isArray(data)) {
          setFiles(data);
        }
      });
    }
  }, []);

  // Save articles and files to Supabase cloud database + localStorage
  useEffect(() => {
    if (articles && articles.length > 0) {
      setCloudJson(CLOUD_KEYS.KM_DATA, articles, "cc_km_staff_articles_v3_fy70");
    }
  }, [articles]);

  useEffect(() => {
    if (files && files.length > 0) {
      setCloudJson(CLOUD_KEYS.KM_FILES, files, "cc_km_files_v2_fy70");
    }
  }, [files]);

  // Close custom dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (authorDropdownRef.current && !authorDropdownRef.current.contains(event.target as Node)) {
        setIsAuthorDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (newAuthorDropdownRef.current && !newAuthorDropdownRef.current.contains(event.target as Node)) {
        setIsNewAuthorDropdownOpen(false);
      }
      if (newCategoryDropdownRef.current && !newCategoryDropdownRef.current.contains(event.target as Node)) {
        setIsNewCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Distinct months list with count
  const availableMonths = useMemo(() => {
    const list: { month: string; count: number }[] = [];
    const seen = new Map<string, number>();
    for (const item of aiNews) {
      seen.set(item.month, (seen.get(item.month) || 0) + 1);
    }
    for (const [month, count] of seen.entries()) {
      list.push({ month, count });
    }
    return list;
  }, [aiNews]);

  // Filtered AI news
  const filteredAiNews = useMemo(() => {
    return aiNews.filter(item => {
      if (selectedMonth !== "all" && item.month !== selectedMonth) return false;
      if (aiCategoryFilter !== "ALL" && item.category !== aiCategoryFilter) return false;
      if (aiSearchQuery.trim()) {
        const q = aiSearchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q) ||
          item.keyTakeaway.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [aiNews, selectedMonth, aiCategoryFilter, aiSearchQuery]);

  // Grouped by month to preserve historical list
  const groupedAiNews = useMemo(() => {
    const map = new Map<string, AiNewsItem[]>();
    for (const item of filteredAiNews) {
      if (!map.has(item.month)) {
        map.set(item.month, []);
      }
      map.get(item.month)!.push(item);
    }
    return Array.from(map.entries()).map(([month, items]) => ({ month, items }));
  }, [filteredAiNews]);

  // Filtered items
  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      if (categoryFilter !== "ALL" && a.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q) ||
          a.authorNickname.toLowerCase().includes(q) ||
          a.tags.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [articles, categoryFilter, searchQuery]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter(f => 
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      f.uploader.toLowerCase().includes(q)
    );
  }, [files, searchQuery]);

  // Handle Open New Article Modal
  const handleOpenNewArticle = () => {
    const defaultAuthor = (activeKmUser && activeKmUser !== "Admin" && activeKmUser !== "guest")
      ? activeKmUser
      : "จอย RL";
    setNewAuthor(defaultAuthor);
    setNewCategory("Creative");
    setIsNewCustomCategory(false);
    setNewCustomCategoryInput("");
    setIsNewAuthorDropdownOpen(false);
    setIsNewCategoryDropdownOpen(false);
    setShowArticleModal(true);
  };

  // Handle Save New Article
  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert("กรุณากรอกหัวข้อและเนื้อหาบทความ");
      return;
    }

    const finalCategory = isNewCustomCategory
      ? (newCustomCategoryInput.trim() || newCategory || "Idea")
      : (newCategory || "Creative");

    const newItem: StaffArticle = {
      id: `art-${Date.now()}`,
      title: newTitle.trim(),
      author: getStaffFullName(newAuthor),
      authorNickname: newAuthor,
      unit: getStaffUnit(newAuthor),
      category: finalCategory,
      content: newContent.trim(),
      readCount: 1,
      publishedAt: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }),
      tags: newTags.split(",").map(t => t.trim()).filter(Boolean)
    };

    const updated = [newItem, ...articles];
    setArticles(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_km_staff_articles_v3_fy70", JSON.stringify(updated));
    }

    setNewTitle("");
    setNewContent("");
    setNewTags("");
    setIsNewCustomCategory(false);
    setNewCustomCategoryInput("");
    setIsNewAuthorDropdownOpen(false);
    setIsNewCategoryDropdownOpen(false);
    setShowArticleModal(false);
    showToast("✨ เผยแพร่บทความใหม่เรียบร้อยแล้ว");
  };

  // Handle Save New File
  const handleSaveFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      alert("กรุณาระบุชื่อไฟล์");
      return;
    }

    const ext = newFileName.includes(".") ? newFileName.split(".").pop()?.toUpperCase() || "FILE" : "FILE";
    const newItem: KmFileItem = {
      id: `file-${Date.now()}`,
      name: newFileName,
      category: newFileCategory,
      size: "8.5 MB",
      format: ext,
      uploader: newFileUploader,
      uploadedAt: new Date().toISOString().slice(0, 10),
      downloadCount: 0,
      url: "#"
    };

    const updated = [newItem, ...files];
    setFiles(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_km_files_v2_fy70", JSON.stringify(updated));
    }

    setNewFileName("");
    setShowFileModal(false);
  };

  return (
    <div className="space-y-6 animate-premium-fade">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-200">
              <BookOpen size={14} className="text-indigo-600" />
              <span>CC Knowledge Management &amp; Creative Intelligence Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              คลังความรู้และนวัตกรรมการสื่อสาร (KM Portal)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              แหล่งรวบรวมเทรนด์สร้างสรรค์ประจำสัปดาห์จาก AI (Weekly Creative Digest), คลังบทความและ How-to จากประสบการณ์จริงของทีมงาน พร้อมคลังไฟล์เทมเพลตมาตรฐาน
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ExportDataDropdown
              reportId="km"
              reportTitle="คลังความรู้ (KM Portal)"
              buttonText="Export Data"
            />
            {activeTab === "articles" ? (
              <button
                onClick={handleOpenNewArticle}
                className="px-4 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Plus size={14} />
                <span>เขียนบทความใหม่</span>
              </button>
            ) : activeTab === "files" ? (
              <button
                onClick={() => setShowFileModal(true)}
                className="px-4 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Upload size={14} />
                <span>อัปโหลดไฟล์ / เทมเพลต</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* 3 Nav Tabs - Capsule Red Pill Design (Per Reference) */}
        <div className="bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 bg-slate-100 p-1 rounded-xl sm:rounded-2xl border border-slate-200 gap-1">
            <button
              onClick={() => setActiveTab("ai-trends")}
              className={`px-3 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-center ${
                activeTab === "ai-trends"
                  ? "bg-[#E03131] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              <BrainCircuit size={16} className="shrink-0" />
              <span className="truncate">1. ข่าวและเทรนด์ AI รายเดือน ({aiNews.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("articles")}
              className={`px-3 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-center ${
                activeTab === "articles"
                  ? "bg-[#E03131] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              <FileText size={16} className="shrink-0" />
              <span className="truncate">2. บทความทีมงาน ({articles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("files")}
              className={`px-3 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-center ${
                activeTab === "files"
                  ? "bg-[#E03131] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              <FolderDown size={16} className="shrink-0" />
              <span className="truncate">3. คลังไฟล์ &amp; เทมเพลต ({files.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: AI MONTHLY TRENDS & BANNER                                    */}
      {/* ===================================================================== */}
      {activeTab === "ai-trends" && (
        <div className="space-y-6">
          {/* Hero Banner: AI Monthly Creative Digest (Dieter Rams Style: Light Gray Background with Orange Text) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#f1f3f5] dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[#d9480f] dark:text-[#f97316] relative overflow-hidden shadow-xs">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#E8590C]" />
            <div className="relative z-10 max-w-3xl space-y-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-[#d9480f] dark:text-[#f97316]">
                เจาะลึก 3 เทรนด์นวัตกรรมสร้างสรรค์รายเดือน: ออกแบบ • PR สื่อสารองค์กร • ผลิต Content
              </h2>
              <p className="text-xs sm:text-sm text-[#d9480f]/85 dark:text-[#f97316]/85 leading-relaxed font-normal">
                คัดกรองข่าวเทคโนโลยีและกรณีศึกษาระดับสากล เดือนละ 3 ข่าวเด่นครบทุกสายงานของทีม CC เพื่อการประยุกต์ใช้อย่างคุ้มค่าและลดภาระการประมวลผลของ Server
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
                <span>อัปเดตอัตโนมัติ: รายเดือน (ตุลาคม 2026)</span>
                <span>•</span>
                <span className="text-[#d9480f] dark:text-[#f97316] font-semibold">เดือนละ 3 ข่าวเด่น (🎨 ออกแบบ • 📢 PR • 🎬 Content)</span>
                <span>•</span>
                <span>คลังสะสมรวม {aiNews.length} ข่าว</span>
              </div>
            </div>
          </div>

          {/* Monthly Archive & Category Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    คลังข่าวและเทรนด์รายเดือน (Monthly Archive)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    สรุปเดือนละ 3 ข่าวเด่น (ออกแบบ / PR / Content) ช่วยลดภาระ Server และเก็บประวัติไว้เรียนรู้ต่อเนื่อง ไม่สูญหาย
                  </p>
                </div>
              </div>

              {/* Search AI News */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={aiSearchQuery}
                  onChange={e => setAiSearchQuery(e.target.value)}
                  placeholder="ค้นหาเทรนด์, หัวข้อ, หรือคำสำคัญ..."
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-indigo-500 w-full sm:w-64"
                />
              </div>
            </div>

            {/* Month Pills */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Clock size={12} />
                <span>เลือกดูรอบเดือน:</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedMonth("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedMonth === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ทั้งหมด ({aiNews.length} ข่าว)
                </button>
                {availableMonths.map(m => (
                  <button
                    key={m.month}
                    onClick={() => setSelectedMonth(m.month)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      selectedMonth === m.month
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>{m.month}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedMonth === m.month ? "bg-white/25 text-white" : "bg-slate-200 text-slate-700"
                    }`}>
                      {m.count} ข่าว
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Pills (Design, PR, Content) */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">สายงาน:</span>
              {(["ALL", "Design", "PR", "Content"] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setAiCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    aiCategoryFilter === cat
                      ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200"
                      : "text-slate-500 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  {cat === "ALL"
                    ? "ทั้งหมด (3 สายงาน)"
                    : cat === "Design"
                    ? "🎨 ออกแบบ (Design)"
                    : cat === "PR"
                    ? "📢 งาน PR (Public Relations)"
                    : "🎬 ผลิตเนื้อหา (Content)"}
                </button>
              ))}
            </div>
          </div>

          {/* AI News Grouped by Month */}
          {groupedAiNews.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
              <Search size={32} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">ไม่พบข่าวหรือบทวิเคราะห์ที่ตรงกับการค้นหา</p>
              <p className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหาหรือเลือกรอบเดือนอื่น</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedAiNews.map(group => (
                <div key={group.month} className="space-y-3">
                  {/* Monthly Group Header with 3 Core Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-100/90 px-4 py-3 rounded-2xl border border-slate-200/80">
                    <div className="flex flex-wrap items-center gap-2.5 text-slate-900 font-black text-xs sm:text-sm">
                      <Calendar size={16} className="text-indigo-600 shrink-0" />
                      <span>{group.month}</span>
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                        {group.items.length} ข่าวเด่นประจำเดือน
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10.5px] font-bold shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">🎨 ออกแบบ</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">📢 PR</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">🎬 Content</span>
                    </div>
                  </div>

                  {/* Cards Grid: 3-column layout matching 3 highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {group.items.map(item => (
                      <div
                        key={item.id}
                        className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border shrink-0 ${
                              item.category === "Design"
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : item.category === "PR"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            }`}>
                              {item.category === "Design"
                                ? "🎨 ออกแบบ (Design)"
                                : item.category === "PR"
                                ? "📢 งาน PR (Public Relations)"
                                : "🎬 ผลิตเนื้อหา (Content)"}
                            </span>
                            <span className="text-[10.5px] font-mono text-slate-400">
                              {item.publishedDate} • {item.readTime}
                            </span>
                          </div>

                          {/* Clickable Article Title */}
                          <h3 className="text-sm font-black text-slate-900 leading-snug">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-indigo-600 transition-colors inline-flex items-start gap-1.5"
                            >
                              <span>{item.title}</span>
                              <ExternalLink size={13} className="shrink-0 text-slate-400 group-hover:text-indigo-600 mt-1 transition-colors" />
                            </a>
                          </h3>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.summary}
                          </p>

                          {/* Key takeaway for team */}
                          <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-1">
                            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
                              💡 ประเด็นประยุกต์ใช้ในทีม CC:
                            </span>
                            <p className="text-slate-800 font-medium text-[11px] leading-relaxed">
                              {item.keyTakeaway}
                            </p>
                          </div>
                        </div>

                        {/* Footer with working link */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400 gap-2">
                          <span className="truncate max-w-[55%] text-[11px]">
                            ที่มา: <strong className="text-slate-600 font-semibold">{item.source}</strong>
                          </span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline inline-flex items-center gap-1.5 cursor-pointer text-xs bg-indigo-50/80 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-all shrink-0 active:scale-95"
                          >
                            <span>อ่านฉบับเต็ม</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: STAFF ARTICLES & LESSONS LEARNED                              */}
      {/* ===================================================================== */}
      {activeTab === "articles" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  คลังบทความและองค์ความรู้โดยพนักงานทีม CC (Staff Knowledge Sharing)
                </h3>
                <p className="text-xs text-slate-500">
                  แบ่งปันเทคนิคการทำงาน เคล็ดลับการแก้ปัญหา และบทเรียนจากชิ้นงานจริงของทั้ง 3 ยูนิต
                </p>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาบทความ, ผู้เขียน, หรือแท็ก..."
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-orange-500 w-56 sm:w-64"
                />
              </div>
            </div>

            {/* Identity & Permission Bar for Staff Knowledge Sharing */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/80 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Shield size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">สิทธิ์การจัดการบทความ:</span>
                    <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                      currentUserRole === "admin" || activeKmUser === "Admin"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : activeKmUser === "guest"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}>
                      {currentUserRole === "admin" || activeKmUser === "Admin"
                        ? "👑 Admin (แก้ไขและลบได้ทุกบทความ)"
                        : activeKmUser === "guest"
                        ? "🔒 ผู้ชมทั่วไป (อ่านอย่างเดียว)"
                        : `✨ ผู้เขียน: ${activeKmUser} (แก้ไข/ลบเฉพาะงานตนเอง)`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ตามมาตรฐาน QMS: เฉพาะผู้เขียนบทความนั้นๆ และ Admin เท่านั้นที่จะมีสิทธิ์แก้ไขและลบข้อมูล
                  </p>
                </div>
              </div>

              {/* Persona Switcher for Quick Verification */}
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <User size={13} />
                  <span>สวมบทบาท:</span>
                </label>
                <select
                  value={activeKmUser}
                  onChange={e => handleSwitchKmUser(e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-red-500 shadow-2xs cursor-pointer"
                >
                  <option value="Admin">👑 Admin (สิทธิ์ผู้ดูแลระบบ)</option>
                  <option value="จอย RL">🎨 จอย RL (ยูนิตงานออกแบบ • เขียนบทความ 1)</option>
                  <option value="ลูกอิน STK">📢 ลูกอิน STK (ยูนิตสื่อสารองค์กร • เขียนบทความ 2)</option>
                  <option value="เอ็นจอย SLR">🎬 เอ็นจอย SLR (ยูนิตผลิตสื่อสร้างสรรค์ • เขียนบทความ 3)</option>
                  <option value="พิม AC">🎨 พิม AC (ยูนิตงานออกแบบ)</option>
                  <option value="โอ๊ต CNB">📢 โอ๊ต CNB (ยูนิตสื่อสารองค์กร)</option>
                  <option value="แก้ว KYK">🎬 แก้ว KYK (ยูนิตผลิตสื่อสร้างสรรค์)</option>
                  <option value="ต้า TTY">🎬 ต้า TTY (ยูนิตผลิตสื่อสร้างสรรค์)</option>
                  <option value="จ๊อบ AA">💼 จ๊อบ AA (หัวหน้าทีม CC)</option>
                  <option value="วา WK">📋 วา WK (ผู้ช่วยหัวหน้าทีม CC)</option>
                  <option value="guest">🔒 บุคคลภายนอก / พนักงานอื่น (Guest)</option>
                </select>

                <button
                  type="button"
                  onClick={handleResetDefaultArticles}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-all cursor-pointer shadow-2xs"
                  title="รีเซ็ตบทความกลับเป็นค่าเริ่มต้น 3 บทความ"
                >
                  รีเซ็ตเริ่มต้น
                </button>
              </div>
            </div>

            {/* Category Filter Pills (พร้อมตัวเลือก Content, Creative, Idea, etc.) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <Filter size={12} />
                <span>หมวดหมู่:</span>
              </span>
              {[
                { id: "ALL", label: "ทั้งหมด" },
                { id: "Content", label: "✍️ Content" },
                { id: "Creative", label: "🎨 Creative" },
                { id: "Idea", label: "💡 Idea" },
                { id: "Graphic & Branding", label: "🏷️ Graphic & Branding" },
                { id: "Corporate PR", label: "📢 Corporate PR" },
                { id: "Video Production", label: "🎬 Video Production" },
                { id: "GenAI & Tools", label: "🤖 GenAI & Tools" },
                { id: "Work Process & WI", label: "📋 Work Process & WI" }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    categoryFilter === cat.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Articles List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArticles.map(art => {
                const canModify = canModifyArticle(art);
                const isAdminUser = currentUserRole === "admin" || activeKmUser === "Admin" || activeKmUser === "admin";

                return (
                  <div
                    key={art.id}
                    onClick={() => handleOpenArticle(art)}
                    className={`p-5 rounded-3xl bg-slate-50/80 border space-y-3.5 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between shadow-2xs cursor-pointer group ${
                      canModify ? "hover:border-red-400 border-slate-200" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-200 text-slate-800 group-hover:bg-red-50 group-hover:text-red-700 transition-colors">
                          {art.category}
                        </span>
                        <span className="text-[10.5px] text-slate-400 font-mono">
                          {art.publishedAt}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 leading-snug group-hover:text-red-600 transition-colors">
                        {art.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {art.content}
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2.5 border-t border-slate-200/60">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-bold text-slate-800">
                          {art.authorNickname}
                        </span>
                        <span className="text-[10.5px] flex items-center gap-1 font-mono text-slate-400">
                          <Eye size={12} />
                          <span>{art.readCount} views</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        {art.tags.map((t, idx) => (
                          <span key={idx} className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                            #{t}
                          </span>
                        ))}
                      </div>

                      {/* Edit & Delete Action Bar (Only Author & Admin) */}
                      <div
                        className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2"
                        onClick={e => e.stopPropagation()}
                      >
                        {canModify ? (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditArticle(art);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                title={`แก้ไขบทความ (สิทธิ์: ${isAdminUser ? "Admin" : "ผู้เขียน: " + art.authorNickname})`}
                              >
                                <Pencil size={11} />
                                <span>แก้ไข</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartDeleteArticle(art);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-300 transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                title={`ลบบทความ (สิทธิ์: ${isAdminUser ? "Admin" : "ผู้เขียน: " + art.authorNickname})`}
                              >
                                <Trash2 size={11} />
                                <span>ลบ</span>
                              </button>
                            </div>

                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
                              <CheckCircle2 size={10} />
                              <span>{isAdminUser ? "สิทธิ์ Admin" : "ผู้เขียน"}</span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full text-[10.5px] text-slate-400">
                            <span className="flex items-center gap-1 font-medium text-slate-400">
                              <Lock size={11} className="text-slate-400 shrink-0" />
                              <span>สิทธิ์แก้ไข/ลบ: ผู้เขียน ({art.authorNickname}) หรือ Admin</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action button to open full article */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-red-600 group-hover:text-red-700 flex items-center gap-1.5 transition-all">
                          <span>คลิกเพื่ออ่านบทความเต็ม</span>
                          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">เปิดอ่านทันที ↗</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: FILE & TEMPLATE REPOSITORY                                    */}
      {/* ===================================================================== */}
      {activeTab === "files" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  คลังไฟล์และเทมเพลตมาตรฐานสำหรับดาวน์โหลด (File &amp; Template Hub)
                </h3>
                <p className="text-xs text-slate-500">
                  รวบรวมไฟล์ CI Guidelines, เทมเพลตกราฟิก, ฟอนต์ทางการ และแบบฟอร์มขอรับบริการ
                </p>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อไฟล์ หรือนามสกุล..."
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-orange-500 w-56 sm:w-64"
                />
              </div>
            </div>

            {/* Identity & Permission Bar for File Repository */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/80 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Shield size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">สิทธิ์การจัดการไฟล์:</span>
                    <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                      currentUserRole === "admin" || activeKmUser === "Admin"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : activeKmUser === "guest"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}>
                      {currentUserRole === "admin" || activeKmUser === "Admin"
                        ? "👑 Admin (แก้ไขและลบได้ทุกไฟล์)"
                        : activeKmUser === "guest"
                        ? "🔒 ผู้ชมทั่วไป (ดาวน์โหลดได้อย่างเดียว)"
                        : `✨ ผู้อัปโหลด: ${activeKmUser} (แก้ไข/ลบเฉพาะไฟล์ที่ตนเองอัปโหลด)`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ตามมาตรฐาน QMS: เฉพาะผู้อัปโหลดไฟล์นั้นๆ และ Admin เท่านั้นที่จะมีสิทธิ์แก้ไขและลบข้อมูล
                  </p>
                </div>
              </div>

              {/* Persona Switcher & Reset Button */}
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <User size={13} />
                  <span>สวมบทบาท:</span>
                </label>
                <select
                  value={activeKmUser}
                  onChange={e => handleSwitchKmUser(e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-red-500 shadow-2xs cursor-pointer"
                >
                  <option value="Admin">👑 Admin (สิทธิ์ผู้ดูแลระบบ)</option>
                  <option value="จ๊อบ AA">💼 จ๊อบ AA (อัปโหลด Brand CI Full.pdf)</option>
                  <option value="พิม AC">🎨 พิม AC (อัปโหลด SocialMedia_Templates.psd)</option>
                  <option value="ก้อง IK">🎨 ก้อง IK (อัปโหลด Fonts_Pack.zip)</option>
                  <option value="วา WK">📋 วา WK (อัปโหลด Brief_Standard_Checklist.docx)</option>
                  <option value="จอย RL">🎨 จอย RL</option>
                  <option value="ลูกอิน STK">📢 ลูกอิน STK</option>
                  <option value="เอ็นจอย SLR">🎬 เอ็นจอย SLR</option>
                  <option value="โอ๊ต CNB">📢 โอ๊ต CNB</option>
                  <option value="แก้ว KYK">🎬 แก้ว KYK</option>
                  <option value="ต้า TTY">🎬 ต้า TTY</option>
                  <option value="guest">🔒 บุคคลภายนอก / พนักงานอื่น (Guest)</option>
                </select>

                <button
                  type="button"
                  onClick={handleResetDefaultFiles}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-all cursor-pointer shadow-2xs"
                  title="รีเซ็ตคลังไฟล์กลับเป็นค่าเริ่มต้น 4 รายการ"
                >
                  รีเซ็ตเริ่มต้น
                </button>
              </div>
            </div>

            {/* Files Table */}
            {/* Files Table (Organized & Clean Responsive Layout - Fits 100% without scrollbar) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
              <table className="w-full table-fixed text-left text-xs border-collapse">
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[14%]" />
                  <col className="w-[9%]" />
                  <col className="w-[13%]" />
                  <col className="w-[11%]" />
                  <col className="w-[8%]" />
                  <col className="w-[11%]" />
                </colgroup>
                <thead>
                  <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 sm:px-4 truncate">ชื่อไฟล์ / ทรัพยากร</th>
                    <th className="py-3 px-2 truncate">หมวดหมู่</th>
                    <th className="py-3 px-2 text-right">ขนาด</th>
                    <th className="py-3 px-2 truncate">ผู้อัปโหลด</th>
                    <th className="py-3 px-2 text-center">วันที่อัปโหลด</th>
                    <th className="py-3 px-2 text-center">ดาวน์โหลด</th>
                    <th className="py-3 px-3 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFiles.map(file => {
                    const canModify = canModifyFile(file);
                    const isAdminUser = currentUserRole === "admin" || activeKmUser === "Admin" || activeKmUser === "admin";

                    const formatBadgeStyle = (() => {
                      switch (file.format.toUpperCase()) {
                        case "PDF":
                          return "bg-rose-50 text-rose-700 border-rose-200";
                        case "PSD":
                          return "bg-sky-50 text-sky-700 border-sky-200";
                        case "ZIP":
                        case "RAR":
                          return "bg-amber-50 text-amber-800 border-amber-200";
                        case "DOCX":
                        case "DOC":
                          return "bg-blue-50 text-blue-700 border-blue-200";
                        case "XLSX":
                        case "CSV":
                          return "bg-emerald-50 text-emerald-700 border-emerald-200";
                        default:
                          return "bg-slate-100 text-slate-700 border-slate-200";
                      }
                    })();

                    return (
                      <tr key={file.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 sm:px-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-mono font-bold border shrink-0 ${formatBadgeStyle}`}>
                              {file.format}
                            </span>
                            <span className="font-bold text-slate-900 leading-snug truncate" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-slate-600">
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60 truncate inline-block max-w-full" title={file.category}>
                            {file.category}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono text-slate-600 font-medium whitespace-nowrap text-right text-[11px]">
                          {file.size}
                        </td>
                        <td className="py-3 px-2 text-slate-800 font-semibold truncate text-[11.5px]" title={file.uploader}>
                          {file.uploader}
                        </td>
                        <td className="py-3 px-2 text-slate-500 font-mono whitespace-nowrap text-center text-[11px]">
                          {file.uploadedAt}
                        </td>
                        <td className="py-3 px-2 text-center font-mono whitespace-nowrap text-[11px]">
                          <span className="font-bold text-slate-800">{file.downloadCount}</span>
                          <span className="text-[10px] text-slate-400 ml-0.5">ครั้ง</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDownloadFile(file)}
                              className="p-1.5 bg-slate-900 hover:bg-black text-white rounded-lg inline-flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                              title="ดาวน์โหลดไฟล์นี้"
                            >
                              <Download size={13} />
                            </button>

                            {canModify ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditFile(file)}
                                  className="p-1.5 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg inline-flex items-center justify-center shadow-2xs cursor-pointer active:scale-95 transition-all"
                                  title={`แก้ไขข้อมูลไฟล์ (${isAdminUser ? "Admin" : "ผู้อัปโหลด: " + file.uploader})`}
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartDeleteFile(file)}
                                  className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-300 rounded-lg inline-flex items-center justify-center shadow-2xs cursor-pointer active:scale-95 transition-all"
                                  title={`ลบไฟล์ (${isAdminUser ? "Admin" : "ผู้อัปโหลด: " + file.uploader})`}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            ) : (
                              <span 
                                className="p-1.5 text-slate-400 bg-slate-100 rounded-lg inline-flex items-center justify-center"
                                title={`เฉพาะผู้อัปโหลด (${file.uploader}) หรือ Admin เท่านั้นที่มีสิทธิ์`}
                              >
                                <Lock size={12} />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Write Article Modal */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                เขียนบทความและเคล็ดลับใหม่ (KM Article)
              </h3>
              <button
                onClick={() => setShowArticleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">หัวข้อบทความ:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="เช่น เทคนิคการเตรียมไฟล์ส่งพิมพ์ให้สีตรงกับหน้าจอ..."
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Author & Category Custom Dropdowns (Matching System Design Standard) */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Dropdown 1: ผู้เขียนบทความ */}
                  <div className="space-y-1 relative" ref={newAuthorDropdownRef}>
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>ผู้เขียน:</span>
                      <span className="text-[10px] text-slate-400 font-normal">ทีม CC</span>
                    </label>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewAuthorDropdownOpen(!isNewAuthorDropdownOpen);
                          setIsNewCategoryDropdownOpen(false);
                        }}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 focus:border-orange-500 text-slate-800 font-medium text-xs flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm">
                            {STAFF_AUTHORS.find(s => s.nickname === newAuthor)?.icon || "👤"}
                          </span>
                          <span className="font-bold text-slate-800">{newAuthor}</span>
                          <span className="text-[10.5px] text-slate-400 truncate">
                            ({STAFF_AUTHORS.find(s => s.nickname === newAuthor)?.unit.split(" ")[0] || "ทีม CC"})
                          </span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
                            isNewAuthorDropdownOpen ? "rotate-180 text-orange-600" : ""
                          }`}
                        />
                      </button>

                      {isNewAuthorDropdownOpen && (
                        <div className="absolute z-50 mt-1.5 left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            เลือกผู้เขียนบทความ (ทีม CC)
                          </div>
                          {STAFF_AUTHORS.map(staff => {
                            const isSelected = newAuthor === staff.nickname;
                            return (
                              <button
                                key={staff.nickname}
                                type="button"
                                onClick={() => {
                                  setNewAuthor(staff.nickname);
                                  setIsNewAuthorDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-orange-50 text-orange-900 font-bold border border-orange-200/60"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-sm">{staff.icon}</span>
                                  <div className="truncate">
                                    <div className="font-bold leading-tight">{staff.nickname}</div>
                                    <div className="text-[10px] text-slate-400 font-normal leading-tight truncate">
                                      {staff.unit}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && <Check size={14} className="text-orange-600 shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropdown 2: หมวดหมู่ (พร้อมตัวเลือก Content, Creative, Idea และ อื่นๆ) */}
                  <div className="space-y-1 relative" ref={newCategoryDropdownRef}>
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>หมวดหมู่:</span>
                      {isNewCustomCategory && (
                        <span className="text-[10px] text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded font-bold border border-orange-200 flex items-center gap-1">
                          <Sparkles size={10} />
                          <span>ระบุเอง</span>
                        </span>
                      )}
                    </label>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewCategoryDropdownOpen(!isNewCategoryDropdownOpen);
                          setIsNewAuthorDropdownOpen(false);
                        }}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 focus:border-orange-500 text-slate-800 font-medium text-xs flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm">
                            {isNewCustomCategory
                              ? "➕"
                              : ARTICLE_CATEGORIES.find(c => c.id === newCategory)?.icon || "🏷️"}
                          </span>
                          <span className="font-bold text-slate-800 truncate">
                            {isNewCustomCategory
                              ? newCustomCategoryInput.trim()
                                ? newCustomCategoryInput
                                : "อื่นๆ (ระบุหัวข้อเอง...)"
                              : ARTICLE_CATEGORIES.find(c => c.id === newCategory)?.label || newCategory}
                          </span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
                            isNewCategoryDropdownOpen ? "rotate-180 text-orange-600" : ""
                          }`}
                        />
                      </button>

                      {isNewCategoryDropdownOpen && (
                        <div className="absolute z-50 mt-1.5 left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            เลือกหมวดหมู่บทความ
                          </div>
                          {ARTICLE_CATEGORIES.map(cat => {
                            const isSelected = isNewCustomCategory ? cat.id === "custom" : newCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  if (cat.id === "custom") {
                                    setIsNewCustomCategory(true);
                                    setIsNewCategoryDropdownOpen(false);
                                    if (!newCustomCategoryInput.trim()) {
                                      setNewCustomCategoryInput("");
                                    }
                                  } else {
                                    setIsNewCustomCategory(false);
                                    setNewCategory(cat.id);
                                    setNewCustomCategoryInput("");
                                    setIsNewCategoryDropdownOpen(false);
                                  }
                                }}
                                className={`w-full px-3 py-2 text-left rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-orange-50 text-orange-900 font-bold border border-orange-200/60"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                              >
                                <div className="flex items-start gap-2 truncate">
                                  <span className="text-sm mt-0.5">{cat.icon}</span>
                                  <div className="truncate">
                                    <div className="font-bold leading-tight">{cat.label}</div>
                                    <div className="text-[10px] text-slate-400 font-normal leading-tight truncate">
                                      {cat.desc}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && <Check size={14} className="text-orange-600 shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Custom Category Input (แสดงเมื่อเลือก "อื่นๆ (ระบุหัวข้อเอง...)") */}
                {isNewCustomCategory && (
                  <div className="space-y-1.5 p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50/60 border border-orange-200 animate-in fade-in zoom-in-95 duration-150 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-orange-900 flex items-center gap-1.5 text-xs">
                        <Sparkles size={13} className="text-orange-600" />
                        <span>ระบุหัวข้อ / หมวดหมู่ของคุณเอง (Custom Category):</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewCustomCategory(false);
                          setNewCategory("Creative");
                          setNewCustomCategoryInput("");
                        }}
                        className="text-[10.5px] text-orange-700 hover:text-orange-900 underline font-medium cursor-pointer"
                      >
                        เลือกจากรายการเดิม
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={newCustomCategoryInput}
                        onChange={e => {
                          setNewCustomCategoryInput(e.target.value);
                          setNewCategory(e.target.value);
                        }}
                        placeholder="เช่น Content Strategy, Creative Idea, UX/UI Design, Event Management..."
                        className="w-full p-2.5 rounded-xl bg-white border border-orange-300 font-bold text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs placeholder:font-normal placeholder:text-slate-400 text-xs"
                        autoFocus
                      />
                    </div>
                    <p className="text-[10.5px] text-orange-700/80">
                      💡 ระบบจะบันทึกหัวข้อนี้เป็นป้ายกำกับหมวดหมู่ของบทความโดยอัตโนมัติ
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">เนื้อหาบทความ / เคล็ดลับ:</label>
                <textarea
                  rows={5}
                  required
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="เขียนสาระสำคัญ วิธีการ ขั้นตอน หรือบทเรียนที่ได้..."
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500 leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">แท็กค้นหา (คั่นด้วยจุลภาค):</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="เช่น Photoshop, Print, ColorProof"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#E03131] hover:bg-[#c92a2a] rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  เผยแพร่บทความ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                อัปโหลดไฟล์ / เทมเพลตมาตรฐาน (KM File Hub)
              </h3>
              <button
                onClick={() => setShowFileModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFile} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">ชื่อไฟล์พร้อมนามสกุล:</label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  placeholder="เช่น FastTrack_Poster_A3_Template.psd"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">หมวดหมู่ไฟล์:</label>
                <select
                  value={newFileCategory}
                  onChange={e => setNewFileCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="Graphic Template">Graphic Template (PSD/AI)</option>
                  <option value="Brand CI">Brand CI &amp; Logo Assets</option>
                  <option value="Fonts & Typography">Fonts &amp; Typography</option>
                  <option value="Forms & WI">Forms &amp; WI Documents</option>
                  <option value="Video & Audio">Video &amp; Audio Presets</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">ผู้อัปโหลด:</label>
                <input
                  type="text"
                  required
                  value={newFileUploader}
                  onChange={e => setNewFileUploader(e.target.value)}
                  placeholder="ชื่อผู้แชร์ไฟล์ เช่น พิม AC"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center space-y-1 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <Upload size={24} className="mx-auto text-slate-400" />
                <p className="text-slate-600 font-medium">ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์</p>
                <p className="text-[10px] text-slate-400">รองรับ .PSD, .AI, .PDF, .DOCX, .ZIP ขนาดไม่เกิน 50MB</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFileModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#E03131] hover:bg-[#c92a2a] rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  บันทึกเข้าสู่คลัง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Article Reader Modal (อ่านบทความฉบับเต็ม) */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 border border-slate-100 max-h-[90vh] flex flex-col justify-between overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 shrink-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                    {readingArticle.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {readingArticle.publishedAt}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {readingArticle.title}
                </h2>
              </div>
              <button
                onClick={() => setReadingArticle(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Author Profile Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{readingArticle.author}</span>
                  <span className="text-slate-500 font-semibold">({readingArticle.authorNickname})</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{readingArticle.unit}</p>
              </div>

              <div className="text-right text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Eye size={13} />
                <span>{readingArticle.readCount} views</span>
              </div>
            </div>

            {/* Article Content (Scrollable) */}
            <div className="overflow-y-auto space-y-4 pr-1 text-slate-700 text-xs sm:text-sm leading-relaxed scrollbar-thin">
              {readingArticle.content.split("\n\n").map((para, i) => (
                <p key={i} className="leading-relaxed whitespace-pre-line text-slate-700">
                  {para}
                </p>
              ))}

              {/* Practical takeaway box */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-1 mt-4">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span>💡 สาระสำคัญสำหรับทีมงาน CC (Key Takeaway):</span>
                </span>
                <p className="text-amber-800 leading-relaxed">
                  สามารถนำหลักการข้างต้นไปเป็นแนวทางปฏิบัติจริงตามคู่มือการทำงาน (Work Instruction) เพื่อยกระดับความเร็วและคุณภาพการส่งมอบงานให้ตอบสนองผู้ใช้บริการได้อย่างมีประสิทธิภาพสูงสุด
                </p>
              </div>

              {/* Tags */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-bold text-slate-400 mr-1">แท็ก:</span>
                {readingArticle.tags.map((t, idx) => (
                  <span key={idx} className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleLike(readingArticle.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    likedArticles[readingArticle.id]
                      ? "bg-red-500 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <ThumbsUp size={13} />
                  <span>{likedArticles[readingArticle.id] ? "ถูกใจแล้ว (1)" : "มีประโยชน์"}</span>
                </button>

                <button
                  onClick={() => handleCopyArticleLink(readingArticle)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>{copyFeedback ? "คัดลอกลิงก์แล้ว!" : "แชร์บทความ"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {canModifyArticle(readingArticle) && (
                  <>
                    <button
                      onClick={() => handleStartEditArticle(readingArticle)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="แก้ไขเนื้อหาบทความนี้"
                    >
                      <Pencil size={12} />
                      <span>แก้ไขบทความ</span>
                    </button>
                    <button
                      onClick={() => handleStartDeleteArticle(readingArticle)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="ลบบทความนี้ออกจากคลัง"
                    >
                      <Trash2 size={12} />
                      <span>ลบบทความ</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setReadingArticle(null)}
                  className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-black text-white rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  ปิดหน้าต่างอ่าน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Article Modal (สำหรับผู้เขียน และ Admin) */}
      {showEditModal && editingArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-4 border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Pencil size={18} className="text-amber-600" />
                  <span>แก้ไขบทความองค์ความรู้ (Edit Staff Article)</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">สิทธิ์การแก้ไข:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    currentUserRole === "admin" || activeKmUser === "Admin"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  }`}>
                    {currentUserRole === "admin" || activeKmUser === "Admin"
                      ? "👑 Admin (สิทธิ์ผู้ดูแลระบบ)"
                      : `✨ ผู้เขียนบทความ (${editingArticle.authorNickname})`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingArticle(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedArticle} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">หัวข้อบทความ:</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Author & Category Custom Dropdowns (Matching System Design Standard) */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Dropdown 1: ผู้เขียนบทความ */}
                  <div className="space-y-1 relative" ref={authorDropdownRef}>
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>ผู้เขียน:</span>
                      {currentUserRole === "admin" || activeKmUser === "Admin" || activeKmUser === "admin" ? (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                          สิทธิ์ Admin
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <Lock size={9} /> ล็อกสิทธิ์
                        </span>
                      )}
                    </label>

                    {currentUserRole === "admin" || activeKmUser === "Admin" || activeKmUser === "admin" ? (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAuthorDropdownOpen(!isAuthorDropdownOpen);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className="w-full p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 focus:border-amber-500 text-slate-800 font-medium text-xs flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-sm">
                              {STAFF_AUTHORS.find(s => s.nickname === editAuthor)?.icon || "👤"}
                            </span>
                            <span className="font-bold text-slate-800">{editAuthor}</span>
                            <span className="text-[10.5px] text-slate-400 truncate">
                              ({STAFF_AUTHORS.find(s => s.nickname === editAuthor)?.unit.split(" ")[0] || "ทีม CC"})
                            </span>
                          </div>
                          <ChevronDown
                            size={14}
                            className={`text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
                              isAuthorDropdownOpen ? "rotate-180 text-amber-600" : ""
                            }`}
                          />
                        </button>

                        {isAuthorDropdownOpen && (
                          <div className="absolute z-50 mt-1.5 left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              เลือกผู้เขียนบทความ (ทีม CC)
                            </div>
                            {STAFF_AUTHORS.map(staff => {
                              const isSelected = editAuthor === staff.nickname;
                              return (
                                <button
                                  key={staff.nickname}
                                  type="button"
                                  onClick={() => {
                                    setEditAuthor(staff.nickname);
                                    setIsAuthorDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                    isSelected
                                      ? "bg-amber-50 text-amber-900 font-bold border border-amber-200/60"
                                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="text-sm">{staff.icon}</span>
                                    <div className="truncate">
                                      <div className="font-bold leading-tight">{staff.nickname}</div>
                                      <div className="text-[10px] text-slate-400 font-normal leading-tight truncate">
                                        {staff.unit}
                                      </div>
                                    </div>
                                  </div>
                                  {isSelected && <Check size={14} className="text-amber-600 shrink-0 ml-2" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="w-full p-2.5 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-600 font-medium text-xs flex items-center justify-between cursor-not-allowed select-none shadow-2xs"
                        title="เฉพาะ Admin เท่านั้นที่สามารถเปลี่ยนผู้เขียนได้"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm">
                            {STAFF_AUTHORS.find(s => s.nickname === editAuthor)?.icon || "👤"}
                          </span>
                          <span className="font-bold text-slate-700">{editAuthor}</span>
                          <span className="text-[10.5px] text-slate-500 truncate">
                            ({STAFF_AUTHORS.find(s => s.nickname === editAuthor)?.unit.split(" ")[0] || "ทีม CC"})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                          <Lock size={10} />
                          <span>ล็อกสิทธิ์</span>
                        </div>
                      </div>
                    )}
                    {!(currentUserRole === "admin" || activeKmUser === "Admin" || activeKmUser === "admin") && (
                      <p className="text-[10px] text-slate-400">เฉพาะ Admin เท่านั้นที่สามารถเปลี่ยนผู้เขียนได้</p>
                    )}
                  </div>

                  {/* Dropdown 2: หมวดหมู่ (พร้อมตัวเลือก Content, Creative, Idea และ อื่นๆ) */}
                  <div className="space-y-1 relative" ref={categoryDropdownRef}>
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>หมวดหมู่:</span>
                      {isCustomCategory && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-200 flex items-center gap-1">
                          <Sparkles size={10} />
                          <span>ระบุเอง</span>
                        </span>
                      )}
                    </label>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                          setIsAuthorDropdownOpen(false);
                        }}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 focus:border-amber-500 text-slate-800 font-medium text-xs flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm">
                            {isCustomCategory
                              ? "➕"
                              : ARTICLE_CATEGORIES.find(c => c.id === editCategory)?.icon || "🏷️"}
                          </span>
                          <span className="font-bold text-slate-800 truncate">
                            {isCustomCategory
                              ? customCategoryInput.trim()
                                ? customCategoryInput
                                : "อื่นๆ (ระบุหัวข้อเอง...)"
                              : ARTICLE_CATEGORIES.find(c => c.id === editCategory)?.label || editCategory}
                          </span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
                            isCategoryDropdownOpen ? "rotate-180 text-amber-600" : ""
                          }`}
                        />
                      </button>

                      {isCategoryDropdownOpen && (
                        <div className="absolute z-50 mt-1.5 left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            เลือกหมวดหมู่บทความ
                          </div>
                          {ARTICLE_CATEGORIES.map(cat => {
                            const isSelected = isCustomCategory ? cat.id === "custom" : editCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  if (cat.id === "custom") {
                                    setIsCustomCategory(true);
                                    setIsCategoryDropdownOpen(false);
                                    if (!customCategoryInput.trim()) {
                                      setCustomCategoryInput("");
                                    }
                                  } else {
                                    setIsCustomCategory(false);
                                    setEditCategory(cat.id);
                                    setCustomCategoryInput("");
                                    setIsCategoryDropdownOpen(false);
                                  }
                                }}
                                className={`w-full px-3 py-2 text-left rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-50 text-amber-900 font-bold border border-amber-200/60"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                              >
                                <div className="flex items-start gap-2 truncate">
                                  <span className="text-sm mt-0.5">{cat.icon}</span>
                                  <div className="truncate">
                                    <div className="font-bold leading-tight">{cat.label}</div>
                                    <div className="text-[10px] text-slate-400 font-normal leading-tight truncate">
                                      {cat.desc}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && <Check size={14} className="text-amber-600 shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Custom Category Input (แสดงเมื่อเลือก "อื่นๆ (ระบุหัวข้อเอง...)") */}
                {isCustomCategory && (
                  <div className="space-y-1.5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200 animate-in fade-in zoom-in-95 duration-150 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                        <Sparkles size={13} className="text-amber-600" />
                        <span>ระบุหัวข้อ / หมวดหมู่ของคุณเอง (Custom Category):</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setEditCategory("Creative");
                          setCustomCategoryInput("");
                        }}
                        className="text-[10.5px] text-amber-700 hover:text-amber-900 underline font-medium cursor-pointer"
                      >
                        เลือกจากรายการเดิม
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={customCategoryInput}
                        onChange={e => {
                          setCustomCategoryInput(e.target.value);
                          setEditCategory(e.target.value);
                        }}
                        placeholder="เช่น Content Strategy, Creative Idea, UX/UI Design, Event Management..."
                        className="w-full p-2.5 pl-3 pr-8 rounded-xl bg-white border border-amber-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-xs transition-all shadow-2xs"
                      />
                      {customCategoryInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomCategoryInput("");
                            setEditCategory("");
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <p className="text-[10.5px] text-amber-800/80 leading-relaxed">
                      💡 หมวดหมู่นี้จะแสดงเป็นป้าย Badge สีสดใสในคลังบทความ KM และหน้าอ่านฉบับเต็มทันที
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">เนื้อหาบทความ / เคล็ดลับ:</label>
                <textarea
                  rows={6}
                  required
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">แท็กค้นหา (คั่นด้วยจุลภาค):</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  placeholder="เช่น FastTrack, Photoshop, BrandCI"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingArticle(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-full transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Pencil size={12} />
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (ยืนยันการลบบทความ) */}
      {showDeleteModal && deletingArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  ยืนยันการลบบทความ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  สิทธิ์อนุญาต: <strong className="text-slate-800">{currentUserRole === "admin" || activeKmUser === "Admin" ? "👑 Admin" : `ผู้เขียน (${deletingArticle.authorNickname})`}</strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-800 line-clamp-2">
                {deletingArticle.title}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>ผู้เขียน: <strong>{deletingArticle.authorNickname}</strong></span>
                <span>•</span>
                <span>{deletingArticle.category}</span>
                <span>•</span>
                <span>{deletingArticle.publishedAt}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <span>การลบนี้จะนำบทความออกจากคลัง KM และไม่สามารถกู้คืนได้ (สามารถกดปุ่ม "รีเซ็ตเริ่มต้น" ได้ภายหลัง)</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingArticle(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteArticle}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>ยืนยันลบบทความ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit File Modal (สำหรับผู้อัปโหลด และ Admin) */}
      {showEditFileModal && editingFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Pencil size={18} className="text-amber-600" />
                  <span>แก้ไขข้อมูลไฟล์และเทมเพลต (Edit File)</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">สิทธิ์การแก้ไข:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    currentUserRole === "admin" || activeKmUser === "Admin"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  }`}>
                    {currentUserRole === "admin" || activeKmUser === "Admin"
                      ? "👑 Admin (สิทธิ์ผู้ดูแลระบบ)"
                      : `✨ ผู้อัปโหลด (${editingFile.uploader})`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditFileModal(false);
                  setEditingFile(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedFile} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">ชื่อไฟล์พร้อมนามสกุล:</label>
                <input
                  type="text"
                  required
                  value={editFileName}
                  onChange={e => setEditFileName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">หมวดหมู่ไฟล์:</label>
                  <select
                    value={editFileCategory}
                    onChange={e => setEditFileCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Graphic Template">Graphic Template (PSD/AI)</option>
                    <option value="Brand CI">Brand CI &amp; Logo Assets</option>
                    <option value="Fonts & Typography">Fonts &amp; Typography</option>
                    <option value="Forms & WI">Forms &amp; WI Documents</option>
                    <option value="Video & Audio">Video &amp; Audio Presets</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ขนาดไฟล์:</label>
                  <input
                    type="text"
                    required
                    value={editFileSize}
                    onChange={e => setEditFileSize(e.target.value)}
                    placeholder="เช่น 18.4 MB"
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">ผู้อัปโหลด:</label>
                <select
                  value={editFileUploader}
                  onChange={e => setEditFileUploader(e.target.value)}
                  disabled={activeKmUser !== "Admin" && currentUserRole !== "admin"}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-amber-500 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="จ๊อบ AA">จ๊อบ AA (หัวหน้าทีม CC)</option>
                  <option value="พิม AC">พิม AC (ยูนิตงานออกแบบ)</option>
                  <option value="ก้อง IK">ก้อง IK (ยูนิตงานออกแบบ)</option>
                  <option value="วา WK">วา WK (ผู้ช่วยหัวหน้าทีม CC)</option>
                  <option value="จอย RL">จอย RL (ยูนิตงานออกแบบ)</option>
                  <option value="ลูกอิน STK">ลูกอิน STK (ยูนิตสื่อสารองค์กร)</option>
                  <option value="โอ๊ต CNB">โอ๊ต CNB (ยูนิตสื่อสารองค์กร)</option>
                  <option value="เอ็นจอย SLR">เอ็นจอย SLR (ยูนิตผลิตสื่อสร้างสรรค์)</option>
                  <option value="แก้ว KYK">แก้ว KYK (ยูนิตผลิตสื่อสร้างสรรค์)</option>
                  <option value="ต้า TTY">ต้า TTY (ยูนิตผลิตสื่อสร้างสรรค์)</option>
                  <option value="ทีม CC">ทีม CC</option>
                </select>
                {activeKmUser !== "Admin" && currentUserRole !== "admin" && (
                  <p className="text-[10px] text-slate-400">เฉพาะ Admin เท่านั้นที่สามารถเปลี่ยนผู้อัปโหลดได้</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditFileModal(false);
                    setEditingFile(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-full transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Pencil size={12} />
                  <span>บันทึกการแก้ไขไฟล์</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete File Confirmation Modal (ยืนยันการลบไฟล์) */}
      {showDeleteFileModal && deletingFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-premium-fade">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  ยืนยันการลบไฟล์
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  สิทธิ์อนุญาต: <strong className="text-slate-800">{currentUserRole === "admin" || activeKmUser === "Admin" ? "👑 Admin" : `ผู้อัปโหลด (${deletingFile.uploader})`}</strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-800 line-clamp-2 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                  {deletingFile.format}
                </span>
                <span>{deletingFile.name}</span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>ผู้อัปโหลด: <strong>{deletingFile.uploader}</strong></span>
                <span>•</span>
                <span>{deletingFile.category}</span>
                <span>•</span>
                <span>{deletingFile.size}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <span>การลบนี้จะนำไฟล์ออกจากคลัง KM และไม่สามารถกู้คืนได้ (สามารถกดปุ่ม "รีเซ็ตเริ่มต้น" ได้ภายหลัง)</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteFileModal(false);
                  setDeletingFile(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFile}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>ยืนยันลบไฟล์</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 backdrop-blur-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
