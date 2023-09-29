// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).
//https://github.com/figma/plugin-samples/blob/master/variables-import-export/code.js

let PADDING_LEFT:number = 20;
let PADDING_RIGHT:number = 20;
let PADDING_TOP:number = 20;
let PADDING_BOTTOM:number = 20;

let FRAME_WIDTH:number = 1280;
let FRAME_HEIGHT:number = 720;

let FRAME_START_X: number = FRAME_WIDTH + 100;
let FRAME_START_Y: number = 500;

let currentY = 0;
let baseY    = 0;

let COLOR_CELL_DEFAULT_SPACING = 20;
let COMPONENTS_SPACING = 100;
let COMPONENTS_X = 0;

enum NODE_TYPE {
  COLLECTION_NODE,
  MODE_NODE,
  VARIABLE_NAME,
  VARIABLE_VALUE
}

let LOCALE = {
  collectionHeading: "Collection Row Component",
  variableName: "Variable Name Component",
  variableValue: "Variable Value Component",
  groupRow: "Group Row Component",
  groupText: "Group Text Component",
  modeText: "Mode Text",
  modeRow: "Mode Row Component",
  genericRow: "Variable Row Component",
  colorCell: "Color Cell Component",
  colorRowCell: "Color Variable Row Component"
}

let FONT = {
  family: "Space Mono",
  style: "Regular",
}

let FONT_COLOR = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };

let BORDER:SolidPaint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };

let RECT_COLOR:SolidPaint = { type: 'SOLID', color: { r: 1, g: 0, b: 0 } };

let TEXT_AUTO_RESIZE:"WIDTH_AND_HEIGHT" | "NONE" | "HEIGHT" | "TRUNCATE" = "WIDTH_AND_HEIGHT";

let FONT_SIZES = {
  collection: 36,
  generic: 24
}

let LAYOUT_SIZING_FILL:"FIXED" | "HUG" | "FILL" = "FILL";
let LAYOUT_SIZING_HUG:"FIXED" | "HUG" | "FILL" = "HUG";
let LAYOUT_SIZING_FIXED:"FIXED" | "HUG" | "FILL" = "HUG";

let LAYOUT_MODE_H:"NONE" | "HORIZONTAL" | "VERTICAL" = "HORIZONTAL";
let LAYOUT_MODE_V:"NONE" | "HORIZONTAL" | "VERTICAL" = "VERTICAL";

let PRIMARY_AXIS_ALIGN_ITEMS_CENTER:"MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN" = "CENTER";
let COUNTER_AXIS_ALIGN_ITEMS_CENTER:"MIN" | "MAX" | "CENTER" | "BASELINE" = "CENTER";

let LAYOUT_ALIGN_INHERIT:"MIN" | "MAX" | "CENTER" | "STRETCH" | "INHERIT" = "INHERIT";

let MIN_COMPONENT_SIZE = {
  w: 400,
  h: 100
}

let DEFAULT_TEXT_PREFIX = {
  groupRow: "Group ",
  modesRow: "Mode ",
  variableName: "Name ",
  variableValue: "Value ",
  colorValue: "Hex ",
  modeName: "Name "
}

let AUTO_LAYOUT_DEFAULT_PADDING_H = 20;
let AUTO_LAYOUT_DEFAULT_PADDING_V = 20;

let MODES_PADDING_TOP = 5;
let MODES_PADDING_BOTTOM = 5;
let MODES_TEXT_PADDING_TOP = 5;
let MODES_TEXT_PADDING_LEFT = 20;

let COMPONENT_ITEM_SPACING_DEFAULT = 100;

let GENERIC_ROW_PADDING_TOP = 20;
let GENERIC_ROW_PADDING_BOTTOM = 20;
let GENERIC_ROW_PADDING_LEFT = 20;

let COLOR_ROW_COMP_VERTICAL_PADDING = 20;
let COLOR_ROW_COMP_HORIZONTAL_PADDING = 20;

let COLLECTION_COMPONENT_PADDING_TOP = 20;

let MODES_COMPONENT_ITEM_SPACING = 100;
let MODES_COMPONENT_PADDING_TOP = 10;
let MODES_COMPONENT_PADDING_BOTTOM = 10;

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

class VariablesManager {

  modes                     : {[key:string]: any};

  variableNameComponent     : ComponentNode | null;
  variableValueComponent    : ComponentNode | null;
  collectionTextComponent   : ComponentNode | null;
  modeTextComponent         : ComponentNode | null;
  groupRowComponent        : ComponentNode | null;

  collectionRowComponent    : ComponentNode | null;
  genericRowComponent       : ComponentNode | null;
  colorRowComponent         : ComponentNode | null;
  colorCellComponent        : ComponentNode | null;
  groupTextComponent        :ComponentNode | null;
  modesRowComponent         : ComponentNode | null;
  
  constructor() {
    this.collectionRowComponent = null;
    this.genericRowComponent = null;
    this.modesRowComponent = null;
    this.groupRowComponent = null;
    this.colorRowComponent = null;
    this.colorCellComponent = null;
    this.groupTextComponent = null;
    this.modeTextComponent = null;
    this.collectionTextComponent = null;
    this.variableNameComponent = null;
    this.variableValueComponent = null;
    this.modes = {}
  }

   rgbToHex(value:any) {
    let { r, g, b, a } = value;
    
    if (a !== 1) {
      return `rgba(${[r, g, b]
        .map((n) => Math.round(n * 255))
        .join(", ")}, ${a.toFixed(4)})`;
    }

    const toHex = (value:number) => {
      const hex = Math.round(value * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
  
    const hex = [toHex(r), toHex(g), toHex(b)].join("");
    return `#${hex}`;
  }

  // createCollection(name:string) {
  //   const collection = figma.variables.createVariableCollection(name);
  //   const modeId = collection.modes[0].modeId;
  //   return { collection, modeId };
  // }
  
  // createToken(collection:VariableCollection, modeId:string, type:VariableResolvedDataType, name:string, value:any) {
  //   const token = figma.variables.createVariable(name, collection.id, type);
  //   token.setValueForMode(modeId, value);
  //   return token;
  // }
  
  // createVariable(collection:VariableCollection, modeId:string, key:any, valueKey:any, tokens:any) {
  //   const token = tokens[valueKey];
  //   return this.createToken(collection, modeId, token.resolvedType, key, {
  //     type: "VARIABLE_ALIAS",
  //     id: `${token.id}`,
  //   });
  // }

  adjustComponentY(component: ComponentNode) {
    component.y = COMPONENTS_SPACING + currentY;
    currentY    = component.y + component.height;
  }

  hugLayoutSizing(component:ComponentNode | InstanceNode| TextNode) {
    component.layoutSizingHorizontal  = LAYOUT_SIZING_HUG;
    component.layoutSizingVertical    = LAYOUT_SIZING_HUG;
  }

  fillHugLayoutSizing(component:InstanceNode | ComponentNode | TextNode) {
    component.layoutSizingHorizontal  = LAYOUT_SIZING_FILL;
    component.layoutSizingVertical    = LAYOUT_SIZING_HUG;
  }

  fillFillLayoutSizing(component:InstanceNode | ComponentNode | TextNode) {
    component.layoutSizingHorizontal  = LAYOUT_SIZING_FILL;
    component.layoutSizingVertical    = LAYOUT_SIZING_FILL;
  }

  horizontallayoutMode(component:ComponentNode) {
    component.layoutMode = LAYOUT_MODE_H;
  }

  initFigmaComponent(name:string) {
    const component = figma.createComponent();
    component.x = COMPONENTS_X;
    component.name = name;
    
    this.horizontallayoutMode(component);
    this.hugLayoutSizing(component);
    
    return component;
  }

  async createCollectionComponent() {

    let component = this.initFigmaComponent( LOCALE.collectionHeading);
    let textNode = await this.createGenericText(LOCALE.collectionHeading);
    
    textNode.fontSize = FONT_SIZES.collection;
    component.appendChild(textNode);
    
    this.adjustComponentY(component);
    component.resize(MIN_COMPONENT_SIZE.w, MIN_COMPONENT_SIZE.h);
    
    return component;
  }

  async createGenericText(name:string) {
    const text = figma.createText();

    // Load the font in the text node before setting the characters
    
    await figma.loadFontAsync({
      family: (text.fontName as FontName).family,
      style: (text.fontName as FontName).style,
    });

    await figma.loadFontAsync(FONT);

    text.name       = name;
    text.characters = name;

    text.fontSize = FONT_SIZES.generic;
    text.fills = [{ type: 'SOLID', color: FONT_COLOR.color }];

    text.setRangeFontName(0, text.characters.length, FONT);

    text.textAutoResize = TEXT_AUTO_RESIZE;
    
    return text;
  }

  async createVariableComponent(name:string) {
    const component = this.initFigmaComponent(name)
    
    let text = await this.createGenericText(name);
    
    component.appendChild(text);
    text.layoutSizingHorizontal = LAYOUT_SIZING_FILL;
    
    this.adjustComponentY(component);
    component.resize(MIN_COMPONENT_SIZE.w, MIN_COMPONENT_SIZE.h);

    return component;
  }

  async createVariableValueTextComponent() {
    return this.createVariableComponent(LOCALE.variableValue);
  }

  async createVariableNameTextComponent() {
    return this.createVariableComponent(LOCALE.variableName);
  }

  async createGroupTextComponent() {
    const component = this.initFigmaComponent(LOCALE.groupText)
    
    let text = await this.createGenericText(LOCALE.groupText);
    text.fontSize = 30;

    component.appendChild(text);
    
    this.adjustComponentY(component);
    
    return component;
  }

  async createModeTextComponent() {
    const component = this.initFigmaComponent(LOCALE.modeText)
    
    let text = await this.createGenericText(LOCALE.modeText);

    component.appendChild(text);
    
    text.fontSize = 30;

    this.hugLayoutSizing(text);
    
    component.layoutSizingHorizontal = LAYOUT_SIZING_HUG;

    this.adjustComponentY(component);
    
    return component;
  }

  applyBorder(component:ComponentNode) {
    // Create a solid 1 pt border
    const border: SolidPaint = BORDER;

    // Set the strokes property of the frame to the solid border
    component.strokes = [border]
    component.strokeLeftWeight = 0;
    component.strokeBottomWeight = 0;
    component.strokeRightWeight = 0;
    component.strokeTopWeight = 1;

    return component;
  }

  async createGroupRowComponent() {

    const component = this.initFigmaComponent(LOCALE.groupRow);
    
    component.primaryAxisAlignItems = PRIMARY_AXIS_ALIGN_ITEMS_CENTER; // Adjust alignment as needed
    component.counterAxisAlignItems = COUNTER_AXIS_ALIGN_ITEMS_CENTER; // Adjust alignment as needed
    component.itemSpacing = COMPONENT_ITEM_SPACING_DEFAULT;
    component.layoutSizingHorizontal = LAYOUT_SIZING_HUG;
    
    this.applyBorder(component);

    if(!this.groupTextComponent) this.groupTextComponent = await this.createGroupTextComponent();
    let instance = this.groupTextComponent.createInstance();
    
    component.appendChild(instance);
    instance.layoutSizingHorizontal = LAYOUT_SIZING_FILL;
    (instance.children[0] as TextNode).characters = DEFAULT_TEXT_PREFIX.groupRow + 1;

    instance.horizontalPadding  = AUTO_LAYOUT_DEFAULT_PADDING_H;
    instance.verticalPadding    = AUTO_LAYOUT_DEFAULT_PADDING_V;

    this.adjustComponentY(component);
    
    return component;
  }

  async createModesRowComponent(collectionName:string, modes:{modeId:string, name:string}[], frame:FrameNode, count:number) {
    const component = this.initFigmaComponent(collectionName + ":" + LOCALE.modeRow);
    component.itemSpacing = 100;
    component.primaryAxisAlignItems = PRIMARY_AXIS_ALIGN_ITEMS_CENTER; // Adjust alignment as needed
    component.counterAxisAlignItems = COUNTER_AXIS_ALIGN_ITEMS_CENTER; // Adjust alignment as needed
    
    component.paddingTop = MODES_PADDING_TOP;
    component.paddingBottom = MODES_PADDING_BOTTOM;
    
    this.applyBorder(component);

    if(!this.modeTextComponent) this.modeTextComponent = await this.createModeTextComponent();
    let instance = this.modeTextComponent.createInstance();
    
    component.appendChild(instance);

    this.fillHugLayoutSizing(instance);
    
    instance.paddingTop   = MODES_TEXT_PADDING_TOP;
    instance.paddingLeft  = MODES_TEXT_PADDING_LEFT;
    
    (instance.children[0] as TextNode).characters = DEFAULT_TEXT_PREFIX.modesRow + 1;
    
    for(let i = 0; i < modes.length; i++) {
      let instance = this.modeTextComponent.createInstance();
      (instance.children[0] as TextNode).characters = DEFAULT_TEXT_PREFIX.modesRow + String(i + 2);
      component.appendChild(instance);
      
      this.fillHugLayoutSizing(instance);

      instance.paddingTop = MODES_TEXT_PADDING_TOP;
      instance.paddingLeft = MODES_TEXT_PADDING_LEFT;
      
    }
    
    component.resize(frame.width, component.height);
    
    this.adjustComponentY(component);
    
    return component;
  }

  async createGenericRowComponent(collectionName:string, modes:{modeId:string, name:string}[], frame:FrameNode, count:number) {
    const component = this.initFigmaComponent(collectionName + ":" + LOCALE.genericRow);
    
    component.counterAxisAlignItems = COUNTER_AXIS_ALIGN_ITEMS_CENTER; // Adjust alignment as needed
    component.primaryAxisAlignItems = PRIMARY_AXIS_ALIGN_ITEMS_CENTER; // Adjust alignment as needed
    component.itemSpacing = COMPONENT_ITEM_SPACING_DEFAULT;

    this.hugLayoutSizing(component);
    
    component.paddingTop    = GENERIC_ROW_PADDING_TOP;
    component.paddingBottom = GENERIC_ROW_PADDING_BOTTOM;
    component.paddingLeft   = GENERIC_ROW_PADDING_LEFT;
    
    this.applyBorder(component);

    if(!this.variableNameComponent) this.variableNameComponent = await this.createVariableNameTextComponent();
    if(!this.variableValueComponent) this.variableValueComponent = await this.createVariableValueTextComponent();

    let instance = this.variableNameComponent.createInstance();
    component.appendChild(instance);

    (instance.children[0] as TextNode).characters = DEFAULT_TEXT_PREFIX.variableName + 1;

    this.fillHugLayoutSizing(instance);
    
    for(let i = 0; i < modes.length; i++) {
      let instance = this.variableValueComponent.createInstance();
      (instance.children[0] as TextNode).characters = DEFAULT_TEXT_PREFIX.variableValue + String(i + 2);
      component.appendChild(instance);
      this.fillHugLayoutSizing(instance);

    }

    component.resize(frame.width, component.height);
    
    this.adjustComponentY(component);

    return component;
  }

  async createColorCellComponent() {

    const component = this.initFigmaComponent(LOCALE.colorCell);
    
    const rect = figma.createRectangle()
    rect.resize(24,24);
    
    rect.fills = [RECT_COLOR];
    rect.strokes = [BORDER]

    component.appendChild(rect);

    if(!this.variableValueComponent) this.variableValueComponent = await this.createVariableValueTextComponent();

    let instance = this.variableValueComponent.createInstance();
    (instance.children[0] as TextNode).characters = DEFAULT_TEXT_PREFIX.colorValue + 1;
    component.appendChild(instance);

    this.fillFillLayoutSizing(instance);
    
    component.counterAxisAlignItems = COUNTER_AXIS_ALIGN_ITEMS_CENTER; // Adjust alignment as needed
    
    component.resize(MIN_COMPONENT_SIZE.w, MIN_COMPONENT_SIZE.h);

    component.layoutSizingHorizontal = LAYOUT_SIZING_FIXED;
    component.layoutSizingVertical = LAYOUT_SIZING_HUG;

    component.itemSpacing = COLOR_CELL_DEFAULT_SPACING;
    
    this.adjustComponentY(component);

    return component;
  }

  async createColorRowComponent(collectionName:string, modes:{modeId:string, name:string}[], frame:FrameNode, count:number) {
    const component = this.initFigmaComponent(collectionName + ":" + LOCALE.colorRowCell);
    
    component.primaryAxisAlignItems = PRIMARY_AXIS_ALIGN_ITEMS_CENTER; // Adjust alignment as needed
    component.counterAxisAlignItems = COUNTER_AXIS_ALIGN_ITEMS_CENTER; // Adjust alignment as needed

    component.itemSpacing = 100;
    
    this.applyBorder(component);

    if(!this.variableNameComponent) this.variableNameComponent = await this.createVariableNameTextComponent();
    if(!this.variableValueComponent) this.variableValueComponent = await this.createVariableValueTextComponent();

    let instance = this.variableNameComponent.createInstance();
    component.appendChild(instance);
    this.fillHugLayoutSizing(instance);
    
    (instance.children[0] as TextNode).characters = DEFAULT_TEXT_PREFIX.variableName + 1;
   
    for(let i = 0; i < modes.length; i++) {
      let colorCellInstance = this.colorCellComponent?.createInstance();
      
      if(colorCellInstance) {
        component.appendChild(colorCellInstance);
        this.fillFillLayoutSizing(colorCellInstance);
        colorCellInstance.layoutAlign = LAYOUT_ALIGN_INHERIT;
      }
    }

    component.resize(frame.width, component.height);
    
    component.verticalPadding = COLOR_ROW_COMP_VERTICAL_PADDING;
    component.horizontalPadding = COLOR_ROW_COMP_HORIZONTAL_PADDING;

    this.adjustComponentY(component);

    return component;
  }

  

  async createFrame(collection:VariableCollection, count:number) {
    let parent = figma.currentPage;

    const frame = figma.createFrame()
    frame.layoutMode            = LAYOUT_MODE_V;
    frame.primaryAxisAlignItems = PRIMARY_AXIS_ALIGN_ITEMS_CENTER; // Adjust alignment as needed

    frame.resize(FRAME_WIDTH, FRAME_HEIGHT);
    frame.x = FRAME_START_X + (frame.width - PADDING_LEFT - PADDING_RIGHT + 100) * count;
    frame.y = baseY;
    frame.paddingTop = 0;

    frame.layoutSizingVertical = LAYOUT_SIZING_HUG;

    frame.name = collection.name;

    parent.appendChild(frame);

    return frame;
  }

  async createCollectionHeading(collection:VariableCollection, parent:FrameNode) {

    let instance = this.collectionRowComponent?.createInstance();
    if(instance) {
      (instance.children[0] as TextNode).characters = collection.name;
      parent.appendChild(instance);
      instance.layoutSizingHorizontal = LAYOUT_SIZING_FILL;
      instance.paddingTop = COLLECTION_COMPONENT_PADDING_TOP;
    }
  }

  async createModesHeading(modes:{modeId:string, name:string}[], parent:FrameNode) {

    let instance = this.modesRowComponent?.createInstance();
    
    if(instance) {
      let modeComponent: InstanceNode = (instance.children[0] as InstanceNode);
      let textNode =modeComponent.children[0] as TextNode;
      textNode.characters = DEFAULT_TEXT_PREFIX.modeName;

      for(let i = 0; i < modes.length; i++) {
        let mode = modes[i];
        let modeComponent: InstanceNode = (instance.children[i+1] as InstanceNode);
        let textNode = modeComponent.children[0] as TextNode;//instance.children[i + 1] as TextNode;
        
        textNode.characters = mode.name;
      }

      parent.appendChild(instance);

      instance.layoutSizingHorizontal = LAYOUT_SIZING_FIXED;
      instance.primaryAxisAlignItems = PRIMARY_AXIS_ALIGN_ITEMS_CENTER;

      instance.itemSpacing = MODES_COMPONENT_ITEM_SPACING;
      instance.paddingTop = MODES_COMPONENT_PADDING_TOP;
      instance.paddingBottom = MODES_COMPONENT_PADDING_BOTTOM;
    }

    return instance;
  }

  async createGroup(groupName:string, modes:{modeId:string, name:string}[], parent:FrameNode) {
    if(!this.groupRowComponent) this.groupRowComponent = await this.createGroupRowComponent();
    let instance = this.groupRowComponent?.createInstance();
    if(instance) {

      let textNode = (instance.children[0] as InstanceNode).children[0] as TextNode;
      textNode.characters = groupName;

      parent.appendChild(instance);
      this.fillHugLayoutSizing(instance);
    }

    return instance;
  }



  async addVariableNameToInstance(instance:InstanceNode, variable:Variable, name:string) {
    

    let textNode:TextNode = (instance.children[0] as InstanceNode).children[0] as TextNode;
    
    

    textNode.characters = name;
  }

  async appendRowForColor(variable:Variable, parent:FrameNode, variables:{[key:string]: any}) {
    
    let instance = this.colorRowComponent?.createInstance();
    
    if(instance) {
      
      this.addVariableNameToInstance(instance, variable, variables[variable.id].finalName );
      
      let index = 1;
      if(variable.valuesByMode) {
        for (const key in variable.valuesByMode) {
          if (variable.valuesByMode.hasOwnProperty(key)) {
            const value:any = variable.valuesByMode[key];
            if(value["type"] && value["type"] === "VARIABLE_ALIAS") {
              let parentVariable = variables[value["id"]].variable;
              
              let colorNode = instance.children[index++] as InstanceNode;
              
              let newValue = parentVariable.valuesByMode[key];
              (colorNode.children[0] as any).fills = [{ type: 'SOLID', color: { r: newValue.r, g: newValue.g, b: newValue.b} }];
              (colorNode.children[0] as any).opacity = newValue.a;
              let colorNodeTextInstance = (colorNode.children[1] as any);
              colorNodeTextInstance.children[0].characters = parentVariable.name;
            }
            else {
              
              let colorNode = instance.children[index++] as InstanceNode;
              
              (colorNode.children[0] as any).fills = [{ type: 'SOLID', color: { r: value.r, g: value.g, b: value.b} }];
              (colorNode.children[0] as any).opacity = value.a;
              let colorNodeTextInstance = (colorNode.children[1] as any);
              colorNodeTextInstance.children[0].characters = this.rgbToHex(value).toUpperCase();
            }
            
          }
        }
      }
      parent.appendChild(instance);
    }

    return instance;
  }

  async appendRowForOthers(variable:Variable, parent:FrameNode, variables:{[key:string]: any}) {
    let instance = this.genericRowComponent?.createInstance();
    if(instance) {
      this.addVariableNameToInstance(instance, variable, variables[variable.id].finalName);
      let index = 1;
      if(variable.valuesByMode) {
        for (const key in variable.valuesByMode) {
          if (variable.valuesByMode.hasOwnProperty(key)) {
            const value:any = variable.valuesByMode[key];
            

            let textInstanceNode = instance.children[index++] as InstanceNode;
            let textNode = textInstanceNode.children[0] as TextNode;
            
            
            if(value["type"] && value["type"] === "VARIABLE_ALIAS") {
              textNode.characters = variables[value.id].finalName;
            }
            else if(variable.resolvedType === "FLOAT" || variable.resolvedType === "BOOLEAN" || variable.resolvedType === "STRING") {
              textNode.characters = String(value);
            }
            else {
              
            }
          }
        }
      }
      parent.appendChild(instance);
    }

    return instance;
  }

  async createVariableRow(variable:Variable, parent:FrameNode, variables:{[key:string]: any}) {
    let instance;
    if(variable.resolvedType === "COLOR") {
      instance = this.appendRowForColor(variable, parent, variables);
    }
    else {
      instance = this.appendRowForOthers(variable, parent, variables);
      
    } 
    
    return instance;
  }

  async printCollection(collection:VariableCollection, count:number) {
    let frame = await this.createFrame(collection, count);
    await this.createCollectionHeading(collection, frame);
    return frame;
  }

  async printModes(modes:{modeId:string, name:string}[], frame:FrameNode) {
    return this.createModesHeading(modes, frame);
  }

  async printGroup(groupName:string, modes:{modeId:string, name:string}[], frame:FrameNode) {
    return this.createGroup(groupName, modes, frame);
  }

  async printVariable(variable:Variable, parent:FrameNode, variables: {[key:string]: any}) {
    return this.createVariableRow(variable, parent, variables);
  }

  async processCollection(collection: VariableCollection, count:number) {
    let variables: {[key:string]: any} = {};
    let groups: {[key:string]: Variable[]} = {};

    let { name, modes, variableIds } = collection;
    
    
    variableIds.forEach((variableId) => {
      let variable  = figma.variables.getVariableById(variableId);
      if(variable) {

        let variableParts = variable.name.split("/");
        
        if(variableParts.length > 1) {
          let finalName:string = variableParts.pop() || "";
          if(!groups[variableParts[0]]) {
            groups[variableParts[0]] = [];
          }
          variables[variableId] = {variable: variable, finalName: finalName};

          groups[variableParts[0]].push(variable);
        }
        else {
          if(!groups["_NoGroup_"]) {
            groups["_NoGroup_"] = []; 
          }
          groups["_NoGroup_"].push(variable);
          variables[variableId] = {variable: variable, finalName: variable.name};
        }
      }
    });
    
    

    let frame                     = await this.printCollection(collection, count);

    this.genericRowComponent      = await this.createGenericRowComponent(collection.name, modes, frame, count);
    this.modesRowComponent        = await this.createModesRowComponent(collection.name, modes, frame, count);
    this.colorRowComponent        = await this.createColorRowComponent(collection.name, modes, frame, count);
    
    await this.printModes(modes, frame);
    
    for(const key in groups) {
      if (groups.hasOwnProperty(key)) {
        const value = groups[key];
        if(key != "_NoGroup_") {
          let groupName = key;
          
          await this.printGroup(groupName, modes, frame);
        }
        
        for(let i = 0; i < value.length;i++) {
          let variable:Variable = value[i];
          
          this.printVariable(variable, frame, variables);
        }
        
        
      }
    }

    // variableIds.forEach((variableId) => {
    //   let variable  = figma.variables.getVariableById(variableId);
    //   if(variable) {

    //     this.printVariable(variable, frame, variables);

    //     variables[variableId] = variable;

    //     const { id, name, resolvedType, valuesByMode } = variable;
        
    //   }
    // });
  }
  
  async read() {
    //const collection = figma.variables.getVariableCollectionById('VariableCollectionId:257c3beb2/57:13');
    //  const localVariables = figma.variables.getLocalVariables('STRING'); // filters local variables by the 'STRING' type
    //const variable = figma.variables.getVariableById(variableId);
    //const collection = figma.variables.createVariableCollection('Example Collection');
    const collections = figma.variables.getLocalVariableCollections();

    currentY  = figma.viewport.bounds.y;
    baseY     = figma.viewport.bounds.y;

    this.collectionRowComponent       = await this.createCollectionComponent();
    this.variableNameComponent        = await this.createVariableNameTextComponent();
    this.variableValueComponent       = await this.createVariableValueTextComponent();
    this.colorCellComponent           = await this.createColorCellComponent();
    this.modeTextComponent            = await this.createModeTextComponent();
    this.groupTextComponent           = await this.createGroupTextComponent();
    this.groupRowComponent            = await this.createGroupRowComponent();
    
    for(let i = 0; i < collections.length; i++) {
      await this.processCollection(collections[i], i);
    }
  }
}

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'create-rectangles') {
    let variablesManager = new VariablesManager();
    variablesManager.read();
  }
  else if(msg.type === 'print-node') {
      console.log(figma.currentPage.selection);
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  //figma.closePlugin();
};
