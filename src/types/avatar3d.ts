/**
 * 2D Avatar Illustration Types
 * Defines customizable features for clean 2D line-art vector character illustrations.
 * Matching Anna Khramtsova style in reference image (bold black outlines, vibrant circle background).
 */

export type Avatar2DHairStyle =
  | 'bald'                 // Bald / clean head
  | 'bangsShoulder'        // Bangs with shoulder-length hair
  | 'curlyMop'             // Curly mop / fluffy curly hair
  | 'curlyLobGlasses'      // Medium wavy curly lob
  | 'spikyMessy'           // Short messy spiky hair
  | 'topBun'               // High curly top bun
  | 'sidePartNeat'         // Short neat side part
  | 'bobBangs'             // Classic bob with bangs
  | 'headbandCurly'        // Headband with curly hair
  | 'sidePartPrep'         // Preppy side part
  | 'hijabWrap'            // Hijab wrap
  | 'middlePartSleek'      // Sleek center part hair
  | 'longStraight'         // Long straight hair
  | 'crewBuzz'             // Short crew cut
  | 'pixieEarrings'        // Pixie cut with earrings
  | 'wavyCrop'             // Casual wavy crop
  | 'undercutPompadour'    // Undercut pompadour
  | 'koreanCurtain'        // Korean comma / curtain hair
  | 'afroPuff'             // Large rounded afro puff
  | 'twinBuns'             // Space / twin buns
  | 'sidePonytail'         // Playful side ponytail
  | 'highPonytail'         // Sleek high ponytail
  | 'sideBraid'            // Elegant side braid
  | 'dreadlocksLong'       // Legacy fallback
  | 'wolfCut'              // Legacy fallback
  | 'beanieKnit'           // Knit beanie hat
  | 'capBaseball';         // Sporty baseball cap

export type Avatar2DEyes =
  | 'dots'                 // Simple classic dot eyes (• •)
  | 'dashes'               // Small line dash eyes (- -)
  | 'smilingArc'           // Upward happy smile curves (◡ ◡)
  | 'roundOpen'            // Open clean round eyes
  | 'winking'              // One open dot, one winking arc
  | 'sparkleEye'           // Sparkling eyes with star reflection
  | 'sleepyChill'          // Relaxed half-closed sleepy eyes
  | 'fierceCat'            // Sharp cat / winged eyes
  | 'heartEyes'            // Loving heart eyes
  | 'starEyes'             // Excited shining star eyes
  | 'dizzySpiral';         // Cartoon dizzy spiral hypno eyes

export type Avatar2DNose =
  | 'hook'                 // Subtle angular L-hook line
  | 'curve'                // Soft curved arch line
  | 'straight'             // Clean vertical line with tip
  | 'dot'                  // Minimalist tiny dot
  | 'buttonRound'          // Cute rounded button nose
  | 'wideTriangle';        // Wide friendly soft nose

export type Avatar2DMouth =
  | 'gentleCurve'          // Simple curved friendly smile (◡)
  | 'wideSmile'            // Wider cheerful open smile
  | 'smirk'                // Playful side smirk
  | 'openGrin'             // Happy open grin showing teeth line
  | 'straight'             // Calm straight line
  | 'laughing'             // Joyful laughing open mouth
  | 'surprisedO'           // Cute round surprised O mouth
  | 'tongueOut'            // Playful cheek tongue out
  | 'catMouth'             // Cute anime cat mouth :3
  | 'bubbleGum'            // Blowing pink bubblegum bubble
  | 'vampireFangs';        // Cute vampire fangs grin

export type Avatar2DFacialHair =
  | 'none'                 // Clean shaven
  | 'fullBeard'            // Full rounded thick beard
  | 'neatMustache'         // Neat classic mustache
  | 'goatee'               // Chin goatee
  | 'stubble'              // Dotted stubble
  | 'handlebar'            // Curled handlebar mustache
  | 'chinStrap'            // Jawline chinstrap beard
  | 'vanDyke';             // Pointed mustache & goatee combo

export type Avatar2DGlasses =
  | 'none'                 // No glasses
  | 'round'                // Round wireframe glasses
  | 'square'               // Rectangular preppy glasses
  | 'sunglasses'           // Dark cool sunglasses
  | 'aviator'              // Aviator teardrop glasses
  | 'catEye'               // Chic cat-eye fashion frames
  | 'halfRim'              // Modern clubmaster half-rim
  | 'pixelThug'            // 8-bit meme pixel thug life glasses
  | 'heartPink'            // Retro heart shaped pink glasses
  | 'starGoggles'          // Star party glasses
  | 'cyberVisor'           // Sci-fi neon visor
  | 'swirlHypno'           // Hypno dizzy swirl glasses
  | 'monocle';             // Vintage detective monocle

export type Avatar2DClothing =
  | 'stripedCrew'          // Striped crewneck shirt
  | 'blazerTop'            // Open blazer over crewneck
  | 'poloCollar'           // Collared polo shirt
  | 'scoopNeck'            // Scoop neck blouse
  | 'buttonHenley'         // Buttoned henley / tee
  | 'turtleneck'           // High neck / turtleneck
  | 'buttonUpShirt'        // Formal button-up shirt
  | 'classicTee'           // Casual crewneck T-shirt
  | 'vNeck'                // Deep V-neck
  | 'stripedTurtle'        // Vertical striped turtleneck
  | 'hoodie'               // Casual hoodie
  | 'suitAndTie'           // Formal suit jacket with necktie
  | 'denimJacket'          // Denim jacket with collar & pockets
  | 'hawaiianShirt'        // Relaxed resort open-collar shirt
  | 'sweaterVest'          // Classic layered sweater vest
  | 'labCoat'              // Professional lab coat / uniform
  | 'superheroCape'        // Superhero suit with cape
  | 'wizardRobe'           // Starry wizard robe
  | 'yukataKimono'         // Traditional festive yukata/kimono
  | 'dinoHoodie'           // Cute dinosaur spiked hoodie
  | 'overallsCute';        // Casual denim overalls

export type Avatar2DAccessories =
  | 'none'
  | 'headband'             // Hair headband
  | 'earrings'             // Golden hoop earrings
  | 'necklace'             // Delicate pendant necklace
  | 'headphone'            // Over-ear stylish headphones
  | 'faceMask'             // Clean modern protective mask
  | 'flowerEar'            // Tropical flower tucked on ear
  | 'partyHat'             // Festive party cone hat
  | 'catEars'              // Cute cat ears headband
  | 'bunnyEars'            // Playful bunny ears
  | 'devilHorns'           // Cute devil horns
  | 'angelHalo'            // Golden angel halo
  | 'crownKing'            // Shiny golden royal crown
  | 'witchHat'             // Fantasy wizard / witch hat
  | 'sproutLeaf'           // Adorable plant sprout on head
  | 'pirateEyepatch'       // Pirate eyepatch
  | 'magicSparkle';        // Floating sparkle stars around head

export interface Avatar3DConfig {
  bgColor: string;         // Background circle color
  skinTone: string;        // Hex skin tone
  hairStyle: Avatar2DHairStyle | any;
  hairColor: string;       // Default #1E1E1E black or shades
  eyes: Avatar2DEyes | any;
  nose: Avatar2DNose | any;
  mouth: Avatar2DMouth | any;
  facialHair: Avatar2DFacialHair | any;
  facialHairColor?: string;
  glasses: Avatar2DGlasses | any;
  glassesColor?: string;
  headwear?: string;
  clothing: Avatar2DClothing | any;
  clothingColor: string;
  secondaryClothingColor?: string;
  accessories?: Avatar2DAccessories | any;
  blush: boolean;          // Subtle cheek blush
}
