import { EditorCore } from '../editor/EditorCore';
import { PREDEFINED_BLOCKS, BlockCategory } from './BlocksData';

export class SectionsPanel {
  private editor: EditorCore;
  private container: HTMLElement;
  private categories: BlockCategory[] = [];

  constructor(editor: EditorCore) {
    this.editor = editor;
    this.container = document.getElementById('sections-container')!;
    this.categories = PREDEFINED_BLOCKS;
    this.render();
  }

  private render() {
    this.container.innerHTML = '';

    this.categories.forEach(category => {
      const section = document.createElement('div');
      section.className = 'section-category';
      section.style.marginBottom = '20px';

      const title = document.createElement('h4');
      title.textContent = category.title;
      title.style.fontSize = '12px';
      title.style.textTransform = 'uppercase';
      title.style.letterSpacing = '0.5px';
      title.style.color = 'var(--panel-text-dim)';
      title.style.marginBottom = '12px';
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = '1fr';
      grid.style.gap = '8px';

      category.blocks.forEach(block => {
        const btn = document.createElement('button');
        btn.className = 'section-block-btn';
        btn.style.padding = '12px';
        btn.style.background = 'var(--panel-surface)';
        btn.style.border = '1px solid var(--panel-border)';
        btn.style.borderRadius = '6px';
        btn.style.color = 'var(--panel-text-bright)';
        btn.style.cursor = 'pointer';
        btn.style.textAlign = 'left';
        btn.style.fontSize = '12px';
        btn.style.transition = 'background 0.2s';

        btn.textContent = block.name;

        btn.addEventListener('mouseover', () => btn.style.background = 'rgba(255,255,255,0.05)');
        btn.addEventListener('mouseout', () => btn.style.background = 'var(--panel-surface)');

        btn.addEventListener('click', () => {
          this.editor.insertHTML(block.html);
        });

        grid.appendChild(btn);
      });

      section.appendChild(grid);
      this.container.appendChild(section);
    });
  }
}
