import { UIElement, ElementSelector, SelectorValidation } from './types';

export class ElementManager {
  private elements: Map<string, UIElement> = new Map();
  private selectors: Map<string, SelectorValidation> = new Map();

  addElement(element: UIElement): void {
    this.elements.set(element.id, element);
  }

  getElement(id: string): UIElement | undefined {
    return this.elements.get(id);
  }

  getAllElements(): UIElement[] {
    return Array.from(this.elements.values());
  }

  updateElement(id: string, updates: Partial<UIElement>): void {
    const element = this.elements.get(id);
    if (!element) {
      throw new Error(`Element ${id} not found`);
    }

    this.elements.set(id, { ...element, ...updates });
  }

  deleteElement(id: string): boolean {
    return this.elements.delete(id);
  }

  findElementsByRole(role: string): UIElement[] {
    return Array.from(this.elements.values()).filter((e) => e.role === role);
  }

  findElementsByName(name: string): UIElement[] {
    return Array.from(this.elements.values()).filter((e) => e.name === name);
  }

  findElementsByType(type: string): UIElement[] {
    return Array.from(this.elements.values()).filter((e) => e.type === type);
  }

  updateSelector(elementId: string, selector: ElementSelector): void {
    const element = this.elements.get(elementId);
    if (!element) {
      throw new Error(`Element ${elementId} not found`);
    }

    element.selector = selector;
    this.elements.set(elementId, element);
  }

  validateSelector(elementId: string, selector: ElementSelector): SelectorValidation {
    const validation: SelectorValidation = {
      isValid: false,
      confidence: 0,
      matchCount: 0,
      lastValidated: new Date(),
    };

    try {
      // Placeholder for actual selector validation logic
      validation.isValid = selector.confidence > 0.5;
      validation.confidence = selector.confidence;
    } catch (error) {
      validation.isValid = false;
    }

    this.selectors.set(elementId, validation);
    return validation;
  }

  getSelectorValidation(elementId: string): SelectorValidation | undefined {
    return this.selectors.get(elementId);
  }

  getElementsBounds(): Map<string, any> {
    const bounds = new Map();
    for (const [id, element] of this.elements) {
      bounds.set(id, element.bounds);
    }
    return bounds;
  }

  findElementAtPosition(x: number, y: number): UIElement | undefined {
    for (const element of this.elements.values()) {
      const { bounds } = element;
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        return element;
      }
    }
    return undefined;
  }
}
