import { EditorCore } from '../editor/EditorCore';
import { PREDEFINED_BLOCKS, BlockCategory } from './BlocksData';

const SECTION_STORAGE_KEY = 'snapedit-sections-state';

/** SVG thumbnail generators — each returns an SVG string that visually represents the layout style of the category */
function getCategoryThumb(title: string): string {
  if (title.includes('Menu') || title.includes('Header')) {
    // Navbar: logo left, nav links center, CTA right
    return `<svg width="32" height="24" viewBox="0 0 50 24" fill="none">
      <rect x="2" y="4" width="10" height="4" rx="1" fill="var(--panel-accent)" opacity="0.9"/>
      <rect x="18" y="5" width="6" height="2" rx="1" fill="rgba(255,255,255,0.35)"/>
      <rect x="26" y="5" width="6" height="2" rx="1" fill="rgba(255,255,255,0.35)"/>
      <rect x="34" y="5" width="6" height="2" rx="1" fill="rgba(255,255,255,0.35)"/>
      <rect x="2" y="16" width="46" height="1" rx="0.5" fill="rgba(255,255,255,0.06)"/>
    </svg>`;
  }
  if (title.includes('Hero')) {
    // Hero: large heading, subtext, CTA button, optional image placeholder
    return `<svg width="32" height="24" viewBox="0 0 50 30" fill="none">
      <rect x="3" y="4" width="22" height="4" rx="1" fill="rgba(255,255,255,0.8)"/>
      <rect x="3" y="11" width="18" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
      <rect x="3" y="15" width="14" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
      <rect x="3" y="21" width="10" height="5" rx="2" fill="var(--panel-accent)" opacity="0.8"/>
      <rect x="32" y="3" width="15" height="22" rx="3" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
      <line x1="36" y1="10" x2="43" y2="10" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>
      <line x1="36" y1="14" x2="43" y2="14" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>
    </svg>`;
  }
  if (title.includes('Features')) {
    // 3 columns with icon placeholders on top
    return `<svg width="32" height="24" viewBox="0 0 50 24" fill="none">
      <rect x="2" y="2" width="13" height="20" rx="2" fill="rgba(255,255,255,0.05)"/>
      <circle cx="8.5" cy="8" r="2.5" fill="var(--panel-accent)" opacity="0.5"/>
      <rect x="5" y="13" width="7" height="1.5" rx="0.75" fill="rgba(255,255,255,0.3)"/>
      <rect x="5" y="16" width="5" height="1" rx="0.5" fill="rgba(255,255,255,0.15)"/>
      <rect x="18" y="2" width="13" height="20" rx="2" fill="rgba(255,255,255,0.05)"/>
      <circle cx="24.5" cy="8" r="2.5" fill="var(--panel-accent)" opacity="0.5"/>
      <rect x="21" y="13" width="7" height="1.5" rx="0.75" fill="rgba(255,255,255,0.3)"/>
      <rect x="21" y="16" width="5" height="1" rx="0.5" fill="rgba(255,255,255,0.15)"/>
      <rect x="34" y="2" width="13" height="20" rx="2" fill="rgba(255,255,255,0.05)"/>
      <circle cx="40.5" cy="8" r="2.5" fill="var(--panel-accent)" opacity="0.5"/>
      <rect x="37" y="13" width="7" height="1.5" rx="0.75" fill="rgba(255,255,255,0.3)"/>
      <rect x="37" y="16" width="5" height="1" rx="0.5" fill="rgba(255,255,255,0.15)"/>
    </svg>`;
  }
  if (title.includes('Opinions') || title.includes('Testimonial')) {
    // Quote card with avatar
    return `<svg width="32" height="24" viewBox="0 0 50 24" fill="none">
      <rect x="6" y="1" width="38" height="22" rx="3" fill="rgba(255,255,255,0.04)"/>
      <text x="10" y="9" fill="rgba(255,255,255,0.15)" font-size="8" font-family="serif">❝</text>
      <rect x="12" y="10" width="26" height="1.5" rx="0.75" fill="rgba(255,255,255,0.25)"/>
      <rect x="14" y="13" width="22" height="1.5" rx="0.75" fill="rgba(255,255,255,0.15)"/>
      <circle cx="17" cy="19" r="2.5" fill="rgba(255,255,255,0.12)"/>
      <rect x="21" y="18" width="10" height="1.5" rx="0.75" fill="rgba(255,255,255,0.2)"/>
    </svg>`;
  }
  if (title.includes('FAQ')) {
    // Accordion lines with +/- icons
    return `<svg width="32" height="24" viewBox="0 0 50 24" fill="none">
      <rect x="4" y="2" width="42" height="5" rx="1.5" fill="rgba(255,255,255,0.06)"/>
      <rect x="7" y="4" width="16" height="1.5" rx="0.75" fill="rgba(255,255,255,0.3)"/>
      <rect x="40" y="3.5" width="3" height="2" rx="0.5" fill="rgba(255,255,255,0.2)"/>
      <rect x="4" y="9" width="42" height="5" rx="1.5" fill="rgba(255,255,255,0.06)"/>
      <rect x="7" y="11" width="20" height="1.5" rx="0.75" fill="rgba(255,255,255,0.3)"/>
      <rect x="40" y="10.5" width="3" height="2" rx="0.5" fill="rgba(255,255,255,0.2)"/>
      <rect x="4" y="16" width="42" height="5" rx="1.5" fill="rgba(255,255,255,0.06)"/>
      <rect x="7" y="18" width="14" height="1.5" rx="0.75" fill="rgba(255,255,255,0.3)"/>
      <rect x="40" y="17.5" width="3" height="2" rx="0.5" fill="rgba(255,255,255,0.2)"/>
    </svg>`;
  }
  if (title.includes('Objection') || title.includes('Text')) {
    // Left/right split text
    return `<svg width="32" height="24" viewBox="0 0 50 24" fill="none">
      <rect x="3" y="4" width="20" height="3" rx="1" fill="rgba(255,255,255,0.4)"/>
      <rect x="3" y="10" width="16" height="1.5" rx="0.75" fill="rgba(255,255,255,0.2)"/>
      <rect x="3" y="13" width="18" height="1.5" rx="0.75" fill="rgba(255,255,255,0.2)"/>
      <rect x="28" y="5" width="18" height="1.5" rx="0.75" fill="rgba(255,255,255,0.15)"/>
      <rect x="28" y="9" width="16" height="1.5" rx="0.75" fill="rgba(255,255,255,0.15)"/>
      <rect x="28" y="13" width="18" height="1.5" rx="0.75" fill="rgba(255,255,255,0.15)"/>
    </svg>`;
  }
  if (title.includes('Logo')) {
    // Horizontal logo row
    return `<svg width="32" height="24" viewBox="0 0 50 18" fill="none">
      <rect x="3" y="4" width="8" height="10" rx="2" fill="rgba(255,255,255,0.07)"/>
      <rect x="14" y="4" width="8" height="10" rx="2" fill="rgba(255,255,255,0.07)"/>
      <rect x="25" y="4" width="8" height="10" rx="2" fill="rgba(255,255,255,0.07)"/>
      <rect x="36" y="4" width="8" height="10" rx="2" fill="rgba(255,255,255,0.07)"/>
    </svg>`;
  }
  if (title.includes('Footer')) {
    // Multi-column footer
    return `<svg width="32" height="24" viewBox="0 0 50 24" fill="none">
      <rect x="0" y="0" width="50" height="24" rx="0" fill="rgba(255,255,255,0.02)"/>
      <rect x="3" y="4" width="10" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
      <rect x="3" y="8" width="8" height="1" rx="0.5" fill="rgba(255,255,255,0.15)"/>
      <rect x="3" y="10" width="6" height="1" rx="0.5" fill="rgba(255,255,255,0.15)"/>
      <rect x="18" y="4" width="6" height="1.5" rx="0.75" fill="rgba(255,255,255,0.25)"/>
      <rect x="18" y="7" width="5" height="1" rx="0.5" fill="rgba(255,255,255,0.12)"/>
      <rect x="18" y="9" width="5" height="1" rx="0.5" fill="rgba(255,255,255,0.12)"/>
      <rect x="30" y="4" width="6" height="1.5" rx="0.75" fill="rgba(255,255,255,0.25)"/>
      <rect x="30" y="7" width="5" height="1" rx="0.5" fill="rgba(255,255,255,0.12)"/>
      <rect x="30" y="9" width="5" height="1" rx="0.5" fill="rgba(255,255,255,0.12)"/>
      <rect x="3" y="20" width="44" height="0.5" rx="0.25" fill="rgba(255,255,255,0.06)"/>
    </svg>`;
  }
  // Generic
  return `<svg width="32" height="24" viewBox="0 0 50 24" fill="none">
    <rect x="5" y="5" width="40" height="14" rx="3" fill="rgba(255,255,255,0.05)"/>
    <rect x="15" y="10" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
  </svg>`;
}

/** Per-block SVG that hints at the specific variant layout */
function getBlockThumb(categoryTitle: string, blockName: string): string {
  const lname = blockName.toLowerCase();

  // Menu / Header
  if (categoryTitle.includes('Menu')) {
    if (lname.includes('simple') || lname.includes('left')) {
      return `<svg width="100%" height="32" viewBox="0 0 220 32" fill="none"><rect width="220" height="32" rx="4" fill="rgba(255,255,255,0.03)"/><rect x="8" y="10" width="24" height="12" rx="2" fill="var(--panel-accent)" opacity="0.6"/><rect x="120" y="14" width="16" height="4" rx="2" fill="rgba(255,255,255,0.3)"/><rect x="142" y="14" width="16" height="4" rx="2" fill="rgba(255,255,255,0.3)"/><rect x="164" y="14" width="16" height="4" rx="2" fill="rgba(255,255,255,0.3)"/><rect x="190" y="10" width="22" height="12" rx="3" fill="rgba(255,255,255,0.12)"/></svg>`;
    }
    if (lname.includes('center')) {
      return `<svg width="100%" height="32" viewBox="0 0 220 32" fill="none"><rect width="220" height="32" rx="4" fill="rgba(255,255,255,0.03)"/><rect x="30" y="14" width="16" height="4" rx="2" fill="rgba(255,255,255,0.3)"/><rect x="52" y="14" width="16" height="4" rx="2" fill="rgba(255,255,255,0.3)"/><rect x="90" y="10" width="40" height="12" rx="2" fill="var(--panel-accent)" opacity="0.5"/><rect x="155" y="14" width="16" height="4" rx="2" fill="rgba(255,255,255,0.3)"/><rect x="177" y="10" width="22" height="12" rx="6" fill="rgba(255,255,255,0.12)"/></svg>`;
    }
    if (lname.includes('pill') || lname.includes('float') || lname.includes('glass')) {
      return `<svg width="100%" height="32" viewBox="0 0 220 32" fill="none"><rect x="20" y="4" width="180" height="24" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/><rect x="30" y="12" width="24" height="8" rx="2" fill="rgba(255,255,255,0.5)"/><rect x="85" y="14" width="14" height="4" rx="2" fill="rgba(255,255,255,0.25)"/><rect x="105" y="14" width="14" height="4" rx="2" fill="rgba(255,255,255,0.25)"/><rect x="125" y="14" width="14" height="4" rx="2" fill="rgba(255,255,255,0.25)"/><rect x="160" y="10" width="28" height="12" rx="6" fill="rgba(255,255,255,0.15)"/></svg>`;
    }
    if (lname.includes('minimal') || lname.includes('underline')) {
      return `<svg width="100%" height="32" viewBox="0 0 220 32" fill="none"><rect width="220" height="32" rx="4" fill="rgba(255,255,255,0.02)"/><rect x="8" y="12" width="30" height="8" rx="1" fill="rgba(255,255,255,0.5)"/><rect x="140" y="14" width="14" height="4" rx="1" fill="rgba(255,255,255,0.3)"/><line x1="140" y1="20" x2="154" y2="20" stroke="rgba(255,255,255,0.4)" stroke-width="1"/><rect x="164" y="14" width="14" height="4" rx="1" fill="rgba(255,255,255,0.2)"/><rect x="188" y="14" width="14" height="4" rx="1" fill="rgba(255,255,255,0.2)"/></svg>`;
    }
  }

  // Hero
  if (categoryTitle.includes('Hero')) {
    if (lname.includes('left')) {
      return `<svg width="100%" height="40" viewBox="0 0 220 50" fill="none"><rect x="10" y="8" width="80" height="8" rx="2" fill="rgba(255,255,255,0.7)"/><rect x="10" y="20" width="100" height="4" rx="2" fill="rgba(255,255,255,0.25)"/><rect x="10" y="28" width="70" height="4" rx="2" fill="rgba(255,255,255,0.25)"/><rect x="10" y="38" width="40" height="10" rx="3" fill="var(--panel-accent)" opacity="0.7"/><rect x="55" y="38" width="40" height="10" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></svg>`;
    }
    if (lname.includes('center')) {
      return `<svg width="100%" height="40" viewBox="0 0 220 50" fill="none"><rect x="40" y="3" width="140" height="6" rx="3" fill="rgba(255,255,255,0.08)"/><rect x="50" y="14" width="120" height="8" rx="2" fill="rgba(255,255,255,0.7)"/><rect x="60" y="26" width="100" height="4" rx="2" fill="rgba(255,255,255,0.2)"/><rect x="80" y="38" width="60" height="10" rx="3" fill="rgba(255,255,255,0.12)"/></svg>`;
    }
    if (lname.includes('split')) {
      return `<svg width="100%" height="40" viewBox="0 0 220 50" fill="none"><rect x="10" y="8" width="70" height="7" rx="2" fill="rgba(255,255,255,0.6)"/><rect x="10" y="20" width="80" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/><rect x="10" y="26" width="60" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/><rect x="10" y="36" width="35" height="8" rx="2" fill="var(--panel-accent)" opacity="0.6"/><rect x="130" y="5" width="80" height="40" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" stroke-dasharray="3 2"/></svg>`;
    }
    if (lname.includes('dark')) {
      return `<svg width="100%" height="40" viewBox="0 0 220 50" fill="none"><rect width="220" height="50" rx="4" fill="rgba(255,255,255,0.03)"/><rect x="70" y="5" width="80" height="8" rx="2" fill="rgba(255,255,255,0.5)"/><rect x="60" y="18" width="100" height="3" rx="1.5" fill="rgba(255,255,255,0.15)"/><rect x="65" y="24" width="90" height="3" rx="1.5" fill="rgba(255,255,255,0.15)"/><rect x="75" y="36" width="30" height="9" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="110" y="36" width="35" height="9" rx="3" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></svg>`;
    }
  }

  // Features
  if (categoryTitle.includes('Features')) {
    if (lname.includes('3 col') || lname.includes('icon')) {
      return `<svg width="100%" height="36" viewBox="0 0 220 36" fill="none"><rect x="10" y="2" width="60" height="32" rx="4" fill="rgba(255,255,255,0.04)"/><circle cx="40" cy="12" r="4" fill="var(--panel-accent)" opacity="0.4"/><rect x="25" y="20" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/><rect x="28" y="26" width="24" height="2" rx="1" fill="rgba(255,255,255,0.12)"/><rect x="80" y="2" width="60" height="32" rx="4" fill="rgba(255,255,255,0.04)"/><circle cx="110" cy="12" r="4" fill="var(--panel-accent)" opacity="0.4"/><rect x="95" y="20" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/><rect x="98" y="26" width="24" height="2" rx="1" fill="rgba(255,255,255,0.12)"/><rect x="150" y="2" width="60" height="32" rx="4" fill="rgba(255,255,255,0.04)"/><circle cx="180" cy="12" r="4" fill="var(--panel-accent)" opacity="0.4"/><rect x="165" y="20" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/><rect x="168" y="26" width="24" height="2" rx="1" fill="rgba(255,255,255,0.12)"/></svg>`;
    }
    if (lname.includes('2x2') || lname.includes('card')) {
      return `<svg width="100%" height="36" viewBox="0 0 220 36" fill="none"><rect x="10" y="2" width="95" height="14" rx="4" fill="rgba(255,255,255,0.05)"/><rect x="15" y="6" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/><rect x="115" y="2" width="95" height="14" rx="4" fill="rgba(255,255,255,0.05)"/><rect x="120" y="6" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/><rect x="10" y="20" width="95" height="14" rx="4" fill="rgba(255,255,255,0.05)"/><rect x="15" y="24" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/><rect x="115" y="20" width="95" height="14" rx="4" fill="rgba(255,255,255,0.08)"/><rect x="120" y="24" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/></svg>`;
    }
    if (lname.includes('left text') || lname.includes('right image')) {
      return `<svg width="100%" height="36" viewBox="0 0 220 36" fill="none"><rect x="10" y="5" width="50" height="4" rx="1" fill="rgba(255,255,255,0.3)"/><rect x="10" y="12" width="40" height="2" rx="1" fill="rgba(255,255,255,0.15)"/><rect x="10" y="20" width="50" height="4" rx="1" fill="rgba(255,255,255,0.3)"/><rect x="10" y="27" width="40" height="2" rx="1" fill="rgba(255,255,255,0.15)"/><rect x="130" y="2" width="80" height="32" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" stroke-dasharray="3 2"/></svg>`;
    }
    if (lname.includes('list') || lname.includes('left image')) {
      return `<svg width="100%" height="36" viewBox="0 0 220 36" fill="none"><rect x="10" y="2" width="80" height="32" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" stroke-dasharray="3 2"/><rect x="105" y="5" width="50" height="4" rx="1" fill="rgba(255,255,255,0.3)"/><rect x="105" y="12" width="40" height="2" rx="1" fill="rgba(255,255,255,0.15)"/><rect x="105" y="20" width="50" height="4" rx="1" fill="rgba(255,255,255,0.3)"/><rect x="105" y="27" width="40" height="2" rx="1" fill="rgba(255,255,255,0.15)"/></svg>`;
    }
    if (lname.includes('dark') || lname.includes('4 col')) {
      return `<svg width="100%" height="36" viewBox="0 0 220 36" fill="none"><rect width="220" height="36" rx="4" fill="rgba(255,255,255,0.03)"/><rect x="10" y="4" width="45" height="28" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/><rect x="60" y="4" width="45" height="28" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/><rect x="110" y="4" width="45" height="28" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/><rect x="160" y="4" width="45" height="28" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/></svg>`;
    }
    if (lname.includes('zig') || lname.includes('alternating')) {
      return `<svg width="100%" height="36" viewBox="0 0 220 36" fill="none"><rect x="10" y="4" width="60" height="12" rx="2" fill="rgba(255,255,255,0.15)"/><rect x="80" y="4" width="50" height="12" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" stroke-dasharray="3 2"/><rect x="80" y="20" width="60" height="12" rx="2" fill="rgba(255,255,255,0.15)"/><rect x="10" y="20" width="50" height="12" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" stroke-dasharray="3 2"/></svg>`;
    }
    if (lname.includes('stats') || lname.includes('number')) {
      return `<svg width="100%" height="36" viewBox="0 0 220 36" fill="none"><rect width="220" height="36" rx="4" fill="var(--panel-accent)" opacity="0.15"/><rect x="20" y="8" width="24" height="10" rx="2" fill="rgba(255,255,255,0.5)"/><rect x="20" y="22" width="30" height="4" rx="2" fill="rgba(255,255,255,0.2)"/><rect x="70" y="8" width="24" height="10" rx="2" fill="rgba(255,255,255,0.5)"/><rect x="70" y="22" width="30" height="4" rx="2" fill="rgba(255,255,255,0.2)"/><rect x="120" y="8" width="24" height="10" rx="2" fill="rgba(255,255,255,0.5)"/><rect x="120" y="22" width="30" height="4" rx="2" fill="rgba(255,255,255,0.2)"/><rect x="170" y="8" width="24" height="10" rx="2" fill="rgba(255,255,255,0.5)"/><rect x="170" y="22" width="30" height="4" rx="2" fill="rgba(255,255,255,0.2)"/></svg>`;
    }
    if (lname.includes('2×3') || lname.includes('2x3') || lname.includes('centered')) {
      return `<svg width="100%" height="36" viewBox="0 0 220 36" fill="none"><circle cx="40" cy="10" r="5" fill="var(--panel-accent)" opacity="0.3"/><rect x="28" y="18" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/><circle cx="110" cy="10" r="5" fill="var(--panel-accent)" opacity="0.3"/><rect x="98" y="18" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/><circle cx="180" cy="10" r="5" fill="var(--panel-accent)" opacity="0.3"/><rect x="168" y="18" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/><circle cx="40" cy="28" r="4" fill="rgba(255,255,255,0.15)"/><circle cx="110" cy="28" r="4" fill="rgba(255,255,255,0.15)"/><circle cx="180" cy="28" r="4" fill="rgba(255,255,255,0.15)"/></svg>`;
    }
  }

  // Use category thumb as fallback
  return getCategoryThumb(categoryTitle);
}

export class SectionsPanel {
  private editor: EditorCore;
  private container: HTMLElement;
  private categories: BlockCategory[] = [];
  private openState: Record<string, boolean> = {};

  constructor(editor: EditorCore) {
    this.editor = editor;
    this.container = document.getElementById('sections-container')!;
    this.categories = PREDEFINED_BLOCKS;
    this.loadState();
    this.render();
  }

  private loadState() {
    try {
      const saved = localStorage.getItem(SECTION_STORAGE_KEY);
      if (saved) this.openState = JSON.parse(saved);
    } catch { /* ignore */ }
  }

  private saveState() {
    try {
      localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(this.openState));
    } catch { /* ignore */ }
  }

  private isOpen(categoryTitle: string): boolean {
    // Default: first category open, rest collapsed
    if (this.openState[categoryTitle] === undefined) {
      return false;
    }
    return this.openState[categoryTitle];
  }

  private render() {
    this.container.innerHTML = '';
    this.container.className = 'sections-root';

    this.categories.forEach(category => {
      const open = this.isOpen(category.title);
      const dropdown = document.createElement('div');
      dropdown.className = 'section-dropdown' + (open ? '' : ' collapsed');

      // Header
      const header = document.createElement('div');
      header.className = 'section-dropdown-header';

      const iconWrap = document.createElement('div');
      iconWrap.className = 'section-dropdown-icon';
      iconWrap.innerHTML = getCategoryThumb(category.title);

      const title = document.createElement('span');
      title.className = 'section-dropdown-title';
      title.textContent = category.title;

      const count = document.createElement('span');
      count.className = 'section-dropdown-count';
      count.textContent = String(category.blocks.length);

      const chevron = document.createElement('span');
      chevron.className = 'section-dropdown-chevron';
      chevron.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;

      header.appendChild(iconWrap);
      header.appendChild(title);
      header.appendChild(count);
      header.appendChild(chevron);

      header.addEventListener('click', () => {
        const isCollapsed = dropdown.classList.toggle('collapsed');
        this.openState[category.title] = !isCollapsed;
        this.saveState();
      });

      dropdown.appendChild(header);

      // Body
      const body = document.createElement('div');
      body.className = 'section-dropdown-body';

      category.blocks.forEach(block => {
        const btn = document.createElement('button');
        btn.className = 'section-block-btn';

        const thumb = document.createElement('div');
        thumb.className = 'block-thumb';
        thumb.innerHTML = getBlockThumb(category.title, block.name);

        const name = document.createElement('span');
        name.className = 'block-name';
        name.textContent = block.name;

        btn.appendChild(thumb);
        btn.appendChild(name);

        btn.addEventListener('click', () => {
          this.editor.insertHTML(block.html);
        });

        body.appendChild(btn);
      });

      dropdown.appendChild(body);
      this.container.appendChild(dropdown);
    });
  }
}
