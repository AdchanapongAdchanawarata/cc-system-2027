"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  Shuffle, 
  Download, 
  Check, 
  User, 
  Palette, 
  Scissors, 
  Eye, 
  Glasses, 
  Shirt,
  Layers,
  Heart,
  Quote
} from "lucide-react";
import { 
  Avatar3DConfig, 
  Avatar2DHairStyle, 
  Avatar2DEyes, 
  Avatar2DNose, 
  Avatar2DMouth, 
  Avatar2DFacialHair, 
  Avatar2DGlasses, 
  Avatar2DClothing, 
  Avatar2DAccessories 
} from "@/types/avatar3d";
import { Avatar2DRenderer, AvatarItemThumbnail } from "./Avatar2DRenderer";
import { 
  AVATAR_16_PRESETS, 
  getMemberAvatarConfig, 
  saveMemberAvatarConfigLocally,
  resolveCanonicalMemberKey,
} from "@/utils/avatar3dPresets";
import { getMemberCustomQuote, saveMemberCustomQuote } from "@/utils/memberQuote";
import { createClient } from "@/utils/supabase/client";

interface Avatar3DStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMemberName?: string;
  assignees?: { id: string; name: string }[];
  onSaved?: (newConfig: Avatar3DConfig) => void;
}

export const Avatar3DStudioModal: React.FC<Avatar3DStudioModalProps> = ({
  isOpen,
  onClose,
  currentMemberName = "จ๊อบ AA",
  assignees = [],
  onSaved,
}) => {
  const [selectedMember, setSelectedMember] = useState(currentMemberName);
  const [config, setConfig] = useState<Avatar3DConfig>(() => getMemberAvatarConfig(currentMemberName));
  const [customQuote, setCustomQuote] = useState<string>(() => getMemberCustomQuote(currentMemberName) || "");
  const [activeTab, setActiveTab] = useState<"presets" | "hair" | "features" | "clothing" | "accessories" | "face">("presets");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      const activeMember = currentMemberName || "จ๊อบ AA";
      setSelectedMember(activeMember);
      const initial = getMemberAvatarConfig(activeMember);
      setConfig(initial);
      setCustomQuote(getMemberCustomQuote(activeMember) || "");
      setSaveSuccess(false);
    }
  }, [isOpen, currentMemberName]);

  if (!isOpen) return null;

  // Background color palette
  const BG_COLORS = [
    { name: "Orange Pop", value: "#F37135" },
    { name: "Rose Pink", value: "#E96C88" },
    { name: "Warm Yellow", value: "#FFCD38" },
    { name: "Sky Cyan", value: "#38B8E8" },
    { name: "Coral Red", value: "#EA533D" },
    { name: "Lavender", value: "#9C88FF" },
    { name: "Teal Green", value: "#2EC4B6" },
    { name: "Mint Fresh", value: "#48CFAD" },
    { name: "Pastel Salmon", value: "#FFAAA6" },
    { name: "Deep Charcoal", value: "#374151" },
    { name: "Emerald", value: "#10B981" },
    { name: "Royal Indigo", value: "#4F46E5" },
  ];

  // Skin tone palette
  const SKIN_TONES = [
    { name: "Porcelain Fair", value: "#FFF8F2" },
    { name: "Peach Ivory", value: "#FFEFE5" },
    { name: "Warm Cream", value: "#F9E4D4" },
    { name: "Sun-kissed", value: "#F0CCA9" },
    { name: "Caramel Bronze", value: "#D8A375" },
    { name: "Rich Espresso", value: "#8D5537" },
  ];

  // Hair color palette
  const HAIR_COLORS = [
    { name: "Jet Black", value: "#1A1A1A" },
    { name: "Espresso Brown", value: "#3D2B1F" },
    { name: "Chestnut Auburn", value: "#6B3A24" },
    { name: "Golden Blonde", value: "#F2BE42" },
    { name: "Ash Silver", value: "#A0AEC0" },
    { name: "Ruby Red", value: "#9E2A2B" },
    { name: "Pastel Rose", value: "#E96C88" },
    { name: "Ocean Blue", value: "#1E88E5" },
    { name: "Emerald Green", value: "#166534" },
    { name: "Lilac Violet", value: "#8B5CF6" },
  ];

  // Clothing color palette
  const CLOTHING_COLORS = [
    { name: "Coral Orange", value: "#E65100" },
    { name: "Bright Red", value: "#D32F2F" },
    { name: "Rose Pink", value: "#E91E63" },
    { name: "Amber Yellow", value: "#FFB300" },
    { name: "Sky Blue", value: "#0288D1" },
    { name: "Navy Blue", value: "#1E3A8A" },
    { name: "Emerald Green", value: "#2E7D32" },
    { name: "Royal Purple", value: "#673AB7" },
    { name: "Charcoal Black", value: "#212121" },
    { name: "Crisp White", value: "#FFFFFF" },
    { name: "Warm Cream", value: "#F5F5F0" },
    { name: "Denim Indigo", value: "#3B82F6" },
  ];

  const handleRandomize = () => {
    const randomPreset = AVATAR_16_PRESETS[Math.floor(Math.random() * AVATAR_16_PRESETS.length)];
    const randomBg = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)].value;
    setConfig({
      ...randomPreset.config,
      bgColor: randomBg,
    });
  };

  const currentLoggedInName = typeof window !== "undefined" ? (localStorage.getItem("cc_user_name") || "").trim().toLowerCase() : "";
  const isSelf = !currentLoggedInName || selectedMember.trim().toLowerCase() === currentLoggedInName || selectedMember.trim().toLowerCase().includes(currentLoggedInName) || currentLoggedInName.includes(selectedMember.trim().toLowerCase());

  const handleSave = async () => {
    setIsSaving(true);
    try {
      saveMemberAvatarConfigLocally(selectedMember, config);
      if (isSelf) {
        await saveMemberCustomQuote(selectedMember, customQuote);
      }

      const { data: memberList } = await supabase.from("assignees").select("id, name, unit");
      const canonical = resolveCanonicalMemberKey(selectedMember);
      const matched = memberList?.find((m) => 
        m.name === selectedMember || 
        m.id === selectedMember || 
        (canonical && (m.name === canonical || resolveCanonicalMemberKey(m.name) === canonical))
      );

      if (matched) {
        // Also save locally under matched.id and matched.name so all badges resolve immediately
        saveMemberAvatarConfigLocally(matched.id, config);
        saveMemberAvatarConfigLocally(matched.name, config);
        if (canonical) {
          saveMemberAvatarConfigLocally(canonical, config);
        }

        const parts = (matched.unit || "creative").split("|");
        const cleanUnit = parts[0] || "creative";
        const role = parts[1] || "assignee";
        let metaObj: any = {};
        if (parts[2]) {
          try {
            metaObj = JSON.parse(decodeURIComponent(parts[2]));
          } catch {
            metaObj = {};
          }
        }
        metaObj.avatarConfig = config;
        if (isSelf) {
          metaObj.customQuote = customQuote.trim();
        }
        const encodedUnit = `${cleanUnit}|${role}|${encodeURIComponent(JSON.stringify(metaObj))}`;

        await supabase.from("assignees").update({ unit: encodedUnit }).eq("id", matched.id);
      }

      setSaveSuccess(true);
      if (onSaved) onSaved(config);

      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Save avatar error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPNG = () => {
    const svgElement = document.getElementById("avatar-studio-svg-preview")?.querySelector("svg");
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, 512, 512);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `2d_avatar_${selectedMember}.png`;
      link.href = pngUrl;
      link.click();
    };
    img.src = url;
  };

  // Hair styles (bald changed to 'สกินเฮด', short labels)
  const HAIR_OPTIONS: { id: Avatar2DHairStyle; label: string }[] = [
    { id: "bald", label: "สกินเฮด" },
    { id: "bangsShoulder", label: "หน้าม้า" },
    { id: "curlyMop", label: "หยิกฟู" },
    { id: "curlyLobGlasses", label: "ลอนสั้น" },
    { id: "spikyMessy", label: "เซอร์สั้น" },
    { id: "topBun", label: "จุกบัน" },
    { id: "sidePartNeat", label: "แสกข้าง" },
    { id: "bobBangs", label: "บ็อบ" },
    { id: "headbandCurly", label: "คาดผม" },
    { id: "sidePartPrep", label: "ปาดข้าง" },
    { id: "middlePartSleek", label: "แสกกลาง" },
    { id: "longStraight", label: "ยาวตรง" },
    { id: "crewBuzz", label: "ครูว์คัต" },
    { id: "pixieEarrings", label: "พิกซี่" },
    { id: "wavyCrop", label: "ลอนคลื่น" },
    { id: "undercutPompadour", label: "ปอมปาดัวร์" },
    { id: "koreanCurtain", label: "คอมม่า" },
    { id: "afroPuff", label: "แอฟโฟร" },
    { id: "twinBuns", label: "บันคู่" },
    { id: "sidePonytail", label: "หางม้าข้าง" },
    { id: "highPonytail", label: "หางม้าสูง" },
    { id: "sideBraid", label: "เปียข้าง" },
    { id: "beanieKnit", label: "ไหมพรม" },
    { id: "capBaseball", label: "หมวกแก๊ป" },
  ];

  // Eyes (11 options - short labels + fun/fantasy)
  const EYE_OPTIONS: { id: Avatar2DEyes; label: string }[] = [
    { id: "dots", label: "จุดกลม" },
    { id: "smilingArc", label: "ตายิ้ม" },
    { id: "dashes", label: "ตาขีด" },
    { id: "roundOpen", label: "ตากลมโต" },
    { id: "winking", label: "ขยิบตา" },
    { id: "sparkleEye", label: "วิบวับ" },
    { id: "sleepyChill", label: "ตาง่วง" },
    { id: "fierceCat", label: "ตาเฉี่ยว" },
    { id: "heartEyes", label: "ตาหัวใจ" },
    { id: "starEyes", label: "ตาดาว" },
    { id: "dizzySpiral", label: "ตามึนงง" },
  ];

  // Nose (6 options - short labels)
  const NOSE_OPTIONS: { id: Avatar2DNose; label: string }[] = [
    { id: "hook", label: "สันคม" },
    { id: "curve", label: "โค้งมน" },
    { id: "straight", label: "สันตรง" },
    { id: "buttonRound", label: "ปุ่มกลม" },
    { id: "wideTriangle", label: "ฐานกว้าง" },
    { id: "dot", label: "จุดมินิมอล" },
  ];

  // Mouth (11 options - short labels + fun/fantasy)
  const MOUTH_OPTIONS: { id: Avatar2DMouth; label: string }[] = [
    { id: "gentleCurve", label: "ยิ้มมุมปาก" },
    { id: "wideSmile", label: "ยิ้มกว้าง" },
    { id: "smirk", label: "ยิ้มกวน" },
    { id: "openGrin", label: "ร่าเริง" },
    { id: "laughing", label: "หัวเราะ" },
    { id: "surprisedO", label: "ปากจู๋" },
    { id: "tongueOut", label: "แลบลิ้น" },
    { id: "straight", label: "ปากตรง" },
    { id: "catMouth", label: "ปากแมว :3" },
    { id: "bubbleGum", label: "หมากฝรั่ง" },
    { id: "vampireFangs", label: "เขี้ยวแวมไพร์" },
  ];

  // Facial hair (8 options - short labels)
  const FACIAL_HAIR_OPTIONS: { id: Avatar2DFacialHair; label: string }[] = [
    { id: "none", label: "ไม่มีหนวด" },
    { id: "neatMustache", label: "หนวดเรียว" },
    { id: "handlebar", label: "หนวดกระดก" },
    { id: "fullBeard", label: "เคราดก" },
    { id: "chinStrap", label: "เคราคาง" },
    { id: "vanDyke", label: "แวนไดค์" },
    { id: "goatee", label: "เคราแพะ" },
    { id: "stubble", label: "ตอหนวด" },
  ];

  // Glasses (13 options - short labels + fantasy/meme/fun)
  const GLASSES_OPTIONS: { id: Avatar2DGlasses; label: string }[] = [
    { id: "none", label: "ไม่ใส่แว่น" },
    { id: "round", label: "ทรงกลม" },
    { id: "square", label: "กรอบเหลี่ยม" },
    { id: "aviator", label: "นักบิน" },
    { id: "catEye", label: "แคทอาย" },
    { id: "halfRim", label: "ไร้กรอบล่าง" },
    { id: "sunglasses", label: "กันแดด" },
    { id: "pixelThug", label: "พิกเซล Thug" },
    { id: "heartPink", label: "แว่นหัวใจ" },
    { id: "starGoggles", label: "แว่นดาว" },
    { id: "cyberVisor", label: "ไซเบอร์" },
    { id: "swirlHypno", label: "ก้นหอย" },
    { id: "monocle", label: "แว่นตาเดียว" },
  ];

  // Clothing (21 options - short labels + fantasy/fun)
  const CLOTHING_OPTIONS: { id: Avatar2DClothing; label: string }[] = [
    { id: "classicTee", label: "เสื้อยืด" },
    { id: "stripedCrew", label: "ลายขวาง" },
    { id: "blazerTop", label: "เบลเซอร์" },
    { id: "suitAndTie", label: "สูทผูกไท" },
    { id: "poloCollar", label: "เสื้อโปโล" },
    { id: "buttonUpShirt", label: "เชิ้ตกระดุม" },
    { id: "denimJacket", label: "แจ็คเก็ตยีนส์" },
    { id: "hawaiianShirt", label: "เชิ้ตฮาวาย" },
    { id: "buttonHenley", label: "เสื้อเฮนลีย์" },
    { id: "turtleneck", label: "คอเต่า" },
    { id: "stripedTurtle", label: "คอเต่าทาง" },
    { id: "sweaterVest", label: "สเวตเตอร์กั๊ก" },
    { id: "labCoat", label: "กาวน์วิชาชีพ" },
    { id: "scoopNeck", label: "คอกว้าง" },
    { id: "vNeck", label: "คอวี" },
    { id: "hoodie", label: "ฮู้ดดี้" },
    { id: "superheroCape", label: "ซูเปอร์ฮีโร่" },
    { id: "wizardRobe", label: "ชุดพ่อมด" },
    { id: "yukataKimono", label: "กิโมโน" },
    { id: "dinoHoodie", label: "ฮู้ดไดโน" },
    { id: "overallsCute", label: "เอี๊ยมยีนส์" },
  ];

  // Accessories (17 options - short labels + fantasy/fun)
  const ACCESSORY_OPTIONS: { id: Avatar2DAccessories; label: string }[] = [
    { id: "none", label: "ไม่มีพร็อพ" },
    { id: "headband", label: "ที่คาดผม" },
    { id: "earrings", label: "ต่างหูห่วง" },
    { id: "headphone", label: "หูฟัง" },
    { id: "faceMask", label: "แมสก์" },
    { id: "flowerEar", label: "ดอกไม้ทัดหู" },
    { id: "necklace", label: "สร้อยคอ" },
    { id: "partyHat", label: "หมวกปาร์ตี้" },
    { id: "catEars", label: "หูแมว" },
    { id: "bunnyEars", label: "หูกระต่าย" },
    { id: "devilHorns", label: "เขาเดวิล" },
    { id: "angelHalo", label: "วงแหวนนางฟ้า" },
    { id: "crownKing", label: "มงกุฎราชา" },
    { id: "witchHat", label: "หมวกพ่อมด" },
    { id: "sproutLeaf", label: "ต้นกล้า" },
    { id: "pirateEyepatch", label: "ตาโจรสลัด" },
    { id: "magicSparkle", label: "วิ้งประกาย" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[94vh] bg-surface border border-surface-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-surface-border bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                2D Avatar Illustration Studio
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  เกมส์แต่งตัว 2D
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                เลือกปรับแต่งภาพวาดสไตล์ 2D Vector ประจำตัวของคุณ สำหรับ Tasks, บอร์ดงาน และอีเมล
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {assignees.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-foreground">
                <User size={13} className="text-slate-400" />
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none cursor-pointer"
                >
                  {assignees.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* LEFT: Live 2D Interactive Preview & Actions (Enlarged Avatar Stage) */}
          <div className="w-full md:w-[320px] p-5 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-surface-border bg-slate-50/40 dark:bg-slate-900/30 shrink-0 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col items-center w-full my-auto">
              
              {/* Avatar Stage Circle - Enlarged to 210px, clean without outer frames */}
              <div 
                id="avatar-studio-svg-preview"
                className="relative rounded-full shadow-2xl transition-transform duration-300 hover:scale-105"
              >
                <Avatar2DRenderer config={config} size={210} showBorder={false} />
              </div>

              {/* Member Label */}
              <div className="mt-3.5 text-center">
                <h4 className="font-bold text-base text-foreground">{selectedMember}</h4>
                <p className="text-[10px] font-semibold text-slate-400 tracking-wider">CC 2D VECTOR AVATAR</p>
              </div>

              {/* Action Buttons: Randomize & Download */}
              <div className="flex items-center gap-2 mt-3.5 w-full">
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-surface-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Shuffle size={14} className="text-amber-500" />
                  <span>สุ่มแบบ 2D</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPNG}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-surface-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Download size={14} className="text-blue-500" />
                  <span>โหลด PNG</span>
                </button>
              </div>

              {/* Custom Member Motto / Quote */}
              <div className="w-full mt-4 pt-3.5 border-t border-surface-border text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                    <Quote size={12} className="text-amber-500 fill-amber-500" />
                    <span>คำคมประจำตัว</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {customQuote.length}/90
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    disabled={!isSelf}
                    value={customQuote}
                    onChange={(e) => setCustomQuote(e.target.value.slice(0, 90))}
                    placeholder={isSelf ? "ใส่คำคม คติประจำใจ หรือสโลแกน..." : "(คำคมแก้ไขได้เฉพาะเจ้าของโปรไฟล์เท่านั้น)"}
                    rows={2}
                    className={`w-full text-xs px-3 py-2 rounded-xl border border-surface-border bg-white dark:bg-slate-800 text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none leading-relaxed transition-all shadow-2xs ${
                      !isSelf ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900" : ""
                    }`}
                  />
                </div>
                <p className={`text-[10px] mt-1 leading-tight ${!isSelf ? "text-amber-600 dark:text-amber-400 font-medium" : "text-slate-400"}`}>
                  {isSelf ? "คำคมนี้จะแสดงบนการ์ดและป้าย Avatar ของคุณ" : "🔒 เฉพาะเจ้าของโปรไฟล์เท่านั้นที่สามารถแก้ไขคำคมนี้ได้"}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Customization Tabs & Options */}
          <div className="flex-1 min-h-0 flex flex-col bg-surface overflow-hidden">
            
            {/* TABS BAR: Compact, Short text, NO horizontal scrollbar! */}
            <div className="grid grid-cols-6 gap-1 px-3 pt-2 border-b border-surface-border w-full select-none overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("presets")}
                className={`flex items-center justify-center gap-1 py-2 px-1 text-xs font-medium rounded-t-xl transition-all cursor-pointer truncate border-b-2 ${
                  activeTab === "presets"
                    ? "border-primary text-primary bg-primary/5 font-bold"
                    : "border-transparent text-slate-500 hover:text-foreground hover:bg-slate-50"
                }`}
                title="16 แบบต้นแบบ"
              >
                <Layers size={13} className="shrink-0" />
                <span className="truncate">ต้นแบบ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("hair")}
                className={`flex items-center justify-center gap-1 py-2 px-1 text-xs font-medium rounded-t-xl transition-all cursor-pointer truncate border-b-2 ${
                  activeTab === "hair"
                    ? "border-primary text-primary bg-primary/5 font-bold"
                    : "border-transparent text-slate-500 hover:text-foreground hover:bg-slate-50"
                }`}
                title="ทรงผม & สีผม"
              >
                <Scissors size={13} className="shrink-0" />
                <span className="truncate">ทรงผม</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("features")}
                className={`flex items-center justify-center gap-1 py-2 px-1 text-xs font-medium rounded-t-xl transition-all cursor-pointer truncate border-b-2 ${
                  activeTab === "features"
                    ? "border-primary text-primary bg-primary/5 font-bold"
                    : "border-transparent text-slate-500 hover:text-foreground hover:bg-slate-50"
                }`}
                title="ตา จมูก ปาก หนวดเครา"
              >
                <Eye size={13} className="shrink-0" />
                <span className="truncate">หน้าตา</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("clothing")}
                className={`flex items-center justify-center gap-1 py-2 px-1 text-xs font-medium rounded-t-xl transition-all cursor-pointer truncate border-b-2 ${
                  activeTab === "clothing"
                    ? "border-primary text-primary bg-primary/5 font-bold"
                    : "border-transparent text-slate-500 hover:text-foreground hover:bg-slate-50"
                }`}
                title="เสื้อผ้า & สีเสื้อ"
              >
                <Shirt size={13} className="shrink-0" />
                <span className="truncate">เสื้อผ้า</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("accessories")}
                className={`flex items-center justify-center gap-1 py-2 px-1 text-xs font-medium rounded-t-xl transition-all cursor-pointer truncate border-b-2 ${
                  activeTab === "accessories"
                    ? "border-primary text-primary bg-primary/5 font-bold"
                    : "border-transparent text-slate-500 hover:text-foreground hover:bg-slate-50"
                }`}
                title="แว่นตา & พร็อพ"
              >
                <Glasses size={13} className="shrink-0" />
                <span className="truncate">พร็อพ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("face")}
                className={`flex items-center justify-center gap-1 py-2 px-1 text-xs font-medium rounded-t-xl transition-all cursor-pointer truncate border-b-2 ${
                  activeTab === "face"
                    ? "border-primary text-primary bg-primary/5 font-bold"
                    : "border-transparent text-slate-500 hover:text-foreground hover:bg-slate-50"
                }`}
                title="สีพื้นหลัง & ผิว"
              >
                <Palette size={13} className="shrink-0" />
                <span className="truncate">สี & ผิว</span>
              </button>
            </div>

            {/* TAB CONTENTS (Scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              
              {/* TAB 1: 16 PRESETS (ต้นแบบ) */}
              {activeTab === "presets" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">เลือกจาก 16 สไตล์ต้นแบบ</h4>
                    <p className="text-xs text-slate-500">คลิกเลือกคาแรคเตอร์ที่ชอบ แล้วปรับแต่งชิ้นส่วนเพิ่มเติมได้อิสระ</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {AVATAR_16_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => setConfig(preset.config)}
                        className="group flex flex-col items-center p-3 rounded-2xl border border-surface-border bg-slate-50/50 dark:bg-slate-800/40 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer hover:shadow-md active:scale-95"
                      >
                        <div className="relative transform transition-transform group-hover:scale-105 duration-200">
                          <Avatar2DRenderer config={preset.config} size={88} showBorder={false} />
                        </div>
                        <span className="mt-2 text-xs font-semibold text-foreground text-center leading-snug group-hover:text-primary transition-colors">
                          {preset.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: HAIR & HAIR COLOR (25 Options) */}
              {activeTab === "hair" && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                        เลือกทรงผม (Hair Style)
                      </label>
                      <span className="text-[11px] text-slate-400 font-semibold">{HAIR_OPTIONS.length} รูปแบบ</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {HAIR_OPTIONS.map((h) => {
                        const isSelected = config.hairStyle === h.id;
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => setConfig({ ...config, hairStyle: h.id })}
                            className="group flex flex-col items-center gap-1.5 cursor-pointer text-center p-1"
                          >
                            <div
                              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-2 transition-all shadow-xs group-hover:scale-105 group-hover:shadow-md overflow-hidden ${
                                isSelected
                                  ? "border-primary ring-4 ring-primary/20 shadow-md scale-105"
                                  : "border-slate-200 dark:border-slate-700 group-hover:border-slate-300"
                              }`}
                            >
                              <AvatarItemThumbnail
                                category="hair"
                                itemId={h.id}
                                itemColor={config.hairColor}
                                size={52}
                              />
                            </div>
                            <span className={`text-[11px] line-clamp-1 max-w-[84px] sm:max-w-[96px] transition-colors ${isSelected ? "font-bold text-primary" : "font-medium text-foreground group-hover:text-primary"}`}>
                              {h.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hair Color Palette */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
                      สีผม (Hair Color)
                    </label>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                      {HAIR_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setConfig({ ...config, hairColor: c.value })}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all cursor-pointer flex items-center justify-center border-2 mx-auto ${
                            config.hairColor === c.value
                              ? "border-white ring-3 ring-primary scale-110 shadow-md"
                              : "border-white/50 hover:scale-110"
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        >
                          {config.hairColor === c.value && <Check size={15} className="text-white drop-shadow-md" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FEATURES - EYES, NOSE, MOUTH & BEARD */}
              {activeTab === "features" && (
                <div className="space-y-6">
                  {/* Eyes Grid (8 Options) */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
                      รูปแบบดวงตา (Eyes) - {EYE_OPTIONS.length} แบบ
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-3">
                      {EYE_OPTIONS.map((e) => {
                        const isSelected = config.eyes === e.id;
                        return (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => setConfig({ ...config, eyes: e.id })}
                            className="group flex flex-col items-center gap-1.5 cursor-pointer text-center p-1"
                          >
                            <div
                              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-2 transition-all shadow-xs group-hover:scale-105 group-hover:shadow-md overflow-hidden ${
                                isSelected
                                  ? "border-primary ring-4 ring-primary/20 shadow-md scale-105"
                                  : "border-slate-200 dark:border-slate-700 group-hover:border-slate-300"
                              }`}
                            >
                              <AvatarItemThumbnail category="eyes" itemId={e.id} size={48} />
                            </div>
                            <span className={`text-[11px] line-clamp-1 max-w-[84px] sm:max-w-[96px] transition-colors ${isSelected ? "font-bold text-primary" : "font-medium text-foreground group-hover:text-primary"}`}>
                              {e.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mouth Grid (8 Options) */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
                      รอยยิ้มและปาก (Mouth) - {MOUTH_OPTIONS.length} แบบ
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-3">
                      {MOUTH_OPTIONS.map((m) => {
                        const isSelected = config.mouth === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setConfig({ ...config, mouth: m.id })}
                            className="group flex flex-col items-center gap-1.5 cursor-pointer text-center p-1"
                          >
                            <div
                              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-2 transition-all shadow-xs group-hover:scale-105 group-hover:shadow-md overflow-hidden ${
                                isSelected
                                  ? "border-primary ring-4 ring-primary/20 shadow-md scale-105"
                                  : "border-slate-200 dark:border-slate-700 group-hover:border-slate-300"
                              }`}
                            >
                              <AvatarItemThumbnail category="mouth" itemId={m.id} size={48} />
                            </div>
                            <span className={`text-[11px] line-clamp-1 max-w-[84px] sm:max-w-[96px] transition-colors ${isSelected ? "font-bold text-primary" : "font-medium text-foreground group-hover:text-primary"}`}>
                              {m.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nose Grid (6 Options) */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
                      ทรงจมูก (Nose) - {NOSE_OPTIONS.length} แบบ
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {NOSE_OPTIONS.map((n) => {
                        const isSelected = config.nose === n.id;
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => setConfig({ ...config, nose: n.id })}
                            className="group flex flex-col items-center gap-1.5 cursor-pointer text-center p-1"
                          >
                            <div
                              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-2 transition-all shadow-xs group-hover:scale-105 group-hover:shadow-md overflow-hidden ${
                                isSelected
                                  ? "border-primary ring-4 ring-primary/20 shadow-md scale-105"
                                  : "border-slate-200 dark:border-slate-700 group-hover:border-slate-300"
                              }`}
                            >
                              <AvatarItemThumbnail category="nose" itemId={n.id} size={48} />
                            </div>
                            <span className={`text-[11px] line-clamp-1 max-w-[84px] sm:max-w-[96px] transition-colors ${isSelected ? "font-bold text-primary" : "font-medium text-foreground group-hover:text-primary"}`}>
                              {n.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Facial Hair Grid (8 Options) */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
                      หนวดและเครา (Beard & Mustache) - {FACIAL_HAIR_OPTIONS.length} แบบ
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-3">
                      {FACIAL_HAIR_OPTIONS.map((b) => {
                        const isSelected = config.facialHair === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setConfig({ ...config, facialHair: b.id })}
                            className="group flex flex-col items-center gap-1.5 cursor-pointer text-center p-1"
                          >
                            <div
                              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-2 transition-all shadow-xs group-hover:scale-105 group-hover:shadow-md overflow-hidden ${
                                isSelected
                                  ? "border-primary ring-4 ring-primary/20 shadow-md scale-105"
                                  : "border-slate-200 dark:border-slate-700 group-hover:border-slate-300"
                              }`}
                            >
                              <AvatarItemThumbnail
                                category="facialHair"
                                itemId={b.id}
                                itemColor={config.facialHairColor || config.hairColor}
                                size={48}
                              />
                            </div>
                            <span className={`text-[11px] line-clamp-1 max-w-[84px] sm:max-w-[96px] transition-colors ${isSelected ? "font-bold text-primary" : "font-medium text-foreground group-hover:text-primary"}`}>
                              {b.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CLOTHING & COLORS (16 Options) */}
              {activeTab === "clothing" && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                        แบบเสื้อผ้า (Clothing)
                      </label>
                      <span className="text-[11px] text-slate-400 font-semibold">{CLOTHING_OPTIONS.length} สไตล์</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-3">
                      {CLOTHING_OPTIONS.map((c) => {
                        const isSelected = config.clothing === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setConfig({ ...config, clothing: c.id })}
                            className="group flex flex-col items-center gap-1.5 cursor-pointer text-center p-1"
                          >
                            <div
                              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-2 transition-all shadow-xs group-hover:scale-105 group-hover:shadow-md overflow-hidden ${
                                isSelected
                                  ? "border-primary ring-4 ring-primary/20 shadow-md scale-105"
                                  : "border-slate-200 dark:border-slate-700 group-hover:border-slate-300"
                              }`}
                            >
                              <AvatarItemThumbnail
                                category="clothing"
                                itemId={c.id}
                                itemColor={config.clothingColor}
                                size={52}
                              />
                            </div>
                            <span className={`text-[11px] line-clamp-1 max-w-[84px] sm:max-w-[96px] transition-colors ${isSelected ? "font-bold text-primary" : "font-medium text-foreground group-hover:text-primary"}`}>
                              {c.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clothing Color Palette */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
                      สีเสื้อผ้า (Clothing Color)
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2.5">
                      {CLOTHING_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setConfig({ ...config, clothingColor: c.value })}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all cursor-pointer flex items-center justify-center border-2 mx-auto ${
                            config.clothingColor === c.value
                              ? "border-white ring-3 ring-primary scale-110 shadow-md"
                              : "border-white/50 hover:scale-110"
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        >
                          {config.clothingColor === c.value && (
                            <Check
                              size={15}
                              className={c.value === "#FFFFFF" || c.value === "#F5F5F0" ? "text-slate-800" : "text-white drop-shadow-md"}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ACCESSORIES & GLASSES */}
              {activeTab === "accessories" && (
                <div className="space-y-6">
                  {/* Glasses Grid (7 Options) */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
                      แว่นตา (Glasses) - {GLASSES_OPTIONS.length} แบบ
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-3">
                      {GLASSES_OPTIONS.map((g) => {
                        const isSelected = config.glasses === g.id;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setConfig({ ...config, glasses: g.id })}
                            className="group flex flex-col items-center gap-1.5 cursor-pointer text-center p-1"
                          >
                            <div
                              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-2 transition-all shadow-xs group-hover:scale-105 group-hover:shadow-md overflow-hidden ${
                                isSelected
                                  ? "border-primary ring-4 ring-primary/20 shadow-md scale-105"
                                  : "border-slate-200 dark:border-slate-700 group-hover:border-slate-300"
                              }`}
                            >
                              <AvatarItemThumbnail
                                category="glasses"
                                itemId={g.id}
                                itemColor={config.glassesColor || "#1E1E1E"}
                                size={52}
                              />
                            </div>
                            <span className={`text-[11px] line-clamp-1 max-w-[84px] sm:max-w-[96px] transition-colors ${isSelected ? "font-bold text-primary" : "font-medium text-foreground group-hover:text-primary"}`}>
                              {g.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Accessories Grid (8 Options) */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
                      เครื่องประดับ &amp; พร็อพ (Props) - {ACCESSORY_OPTIONS.length} แบบ
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-3">
                      {ACCESSORY_OPTIONS.map((a) => {
                        const isSelected = config.accessories === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setConfig({ ...config, accessories: a.id })}
                            className="group flex flex-col items-center gap-1.5 cursor-pointer text-center p-1"
                          >
                            <div
                              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-2 transition-all shadow-xs group-hover:scale-105 group-hover:shadow-md overflow-hidden ${
                                isSelected
                                  ? "border-primary ring-4 ring-primary/20 shadow-md scale-105"
                                  : "border-slate-200 dark:border-slate-700 group-hover:border-slate-300"
                              }`}
                            >
                              <AvatarItemThumbnail
                                category="accessories"
                                itemId={a.id}
                                size={52}
                              />
                            </div>
                            <span className={`text-[11px] line-clamp-1 max-w-[84px] sm:max-w-[96px] transition-colors ${isSelected ? "font-bold text-primary" : "font-medium text-foreground group-hover:text-primary"}`}>
                              {a.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: BACKGROUND & SKIN */}
              {activeTab === "face" && (
                <div className="space-y-6">
                  {/* Background Color */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
                      สีพื้นหลังทรงกลม (Background Circle)
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2.5">
                      {BG_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setConfig({ ...config, bgColor: c.value })}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all cursor-pointer flex items-center justify-center border-2 mx-auto ${
                            config.bgColor === c.value
                              ? "border-white ring-3 ring-primary scale-110 shadow-md"
                              : "border-white/50 hover:scale-110"
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        >
                          {config.bgColor === c.value && <Check size={15} className="text-white drop-shadow-md" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skin Tone */}
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
                      เฉดสีผิว (Skin Tone)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {SKIN_TONES.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setConfig({ ...config, skinTone: c.value })}
                          className={`w-12 h-12 rounded-full transition-all cursor-pointer flex items-center justify-center border-2 mx-auto shadow-xs ${
                            config.skinTone === c.value
                              ? "border-white ring-3 ring-primary scale-110 shadow-md"
                              : "border-slate-200 dark:border-slate-700 hover:scale-110"
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        >
                          {config.skinTone === c.value && <Check size={16} className="text-slate-800 drop-shadow-xs" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cheek Blush Switch */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-surface-border bg-slate-50/60 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <Heart size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground">พวงแก้มระเรื่อ (Cheek Blush)</span>
                        <p className="text-[11px] text-slate-500">แต้มสีชมพูละมุนบนพวงแก้ม</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, blush: !config.blush })}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        config.blush ? "bg-primary justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Footer with Save Button */}
            <div className="p-3.5 px-6 border-t border-surface-border bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-surface-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground transition-all cursor-pointer whitespace-nowrap"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <Check size={15} />
                    <span className="whitespace-nowrap">บันทึกเรียบร้อย!</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span className="whitespace-nowrap">บันทึก Avatar</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
