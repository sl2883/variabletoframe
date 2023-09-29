// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).
//https://github.com/figma/plugin-samples/blob/master/variables-import-export/code.js

let PADDING_LEFT:number = 20;let PADDING_RIGHT:number = 20;
let PADDING_TOP:number = 20;let PADDING_BOTTOM:number = 20;
let PADDING_LEFT_TEXT:number = 20;let PADDING_RIGHT_TEXT:number = 20;

let FRAME_WIDTH:number = 1280;
let FRAME_HEIGHT:number = 720;
let FRAME_START_X: number = 1280 + 100;
let FRAME_START_Y: number = 500;

let currentY = 0;
let baseY = 0;

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

  createCollection(name:string) {
    const collection = figma.variables.createVariableCollection(name);
    const modeId = collection.modes[0].modeId;
    return { collection, modeId };
  }
  
  createToken(collection:VariableCollection, modeId:string, type:VariableResolvedDataType, name:string, value:any) {
    const token = figma.variables.createVariable(name, collection.id, type);
    token.setValueForMode(modeId, value);
    return token;
  }
  
  createVariable(collection:VariableCollection, modeId:string, key:any, valueKey:any, tokens:any) {
    const token = tokens[valueKey];
    return this.createToken(collection, modeId, token.resolvedType, key, {
      type: "VARIABLE_ALIAS",
      id: `${token.id}`,
    });
  }

  adjustComponentY(component: ComponentNode) {
    component.y = 100 + currentY;
    currentY    = component.y + component.height;
  }

  initFigmaComponent(name:string) {
    const component = figma.createComponent();
    component.x = 0;
    component.name = name;
    component.layoutMode = "HORIZONTAL";

    return component;
  }

  async createCollectionComponent() {

    let component = this.initFigmaComponent( LOCALE.collectionHeading);

    let textNode = await this.createTextNode(LOCALE.collectionHeading, NODE_TYPE.COLLECTION_NODE);
    component.appendChild(textNode);

    this.adjustComponentY(component);
    
    return component;
  }

  async createTextNode(name:string, variableType:number) {
    const text = figma.createText();

    // Load the font in the text node before setting the characters
    
    await figma.loadFontAsync({
      family: (text.fontName as FontName).family,
      style: (text.fontName as FontName).style,
    });

    await figma.loadFontAsync({
      family: "Space Mono",
      style: "Regular",
    });

    text.characters = " ";

    text.setRangeFontName(0, text.characters.length, {
      family: "Space Mono",
      style: "Regular",
    });
    text.textAutoResize = "WIDTH_AND_HEIGHT";
    text.name = name;
     // Set bigger font size and red color

     if(variableType === NODE_TYPE.COLLECTION_NODE) {
      text.fontSize = 36;
      text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
     }
     else if(variableType === NODE_TYPE.MODE_NODE) {
      text.fontSize = 30;
      text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
     }
     else if(variableType === NODE_TYPE.VARIABLE_NAME) {
      text.fontSize = 24;
      text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
     }
    else if(variableType === NODE_TYPE.VARIABLE_VALUE) {
      text.fontSize = 24;
      text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
     }

     return text;
  }

  async createGenericText(name:string) {
    const text = figma.createText();

    text.name = name;
    text.characters = name;

    // Load the font in the text node before setting the characters
    
    await figma.loadFontAsync({
      family: (text.fontName as FontName).family,
      style: (text.fontName as FontName).style,
    });

    await figma.loadFontAsync({
      family: "Space Mono",
      style: "Regular",
    });

    text.fontSize = 24;
    text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];

    text.setRangeFontName(0, text.characters.length, {
      family: "Space Mono",
      style: "Regular",
    });

    text.textAutoResize = "WIDTH_AND_HEIGHT";
    
    return text;
  }

  async createVariableComponent(name:string) {
    const component = this.initFigmaComponent(name)
    
    let text = await this.createGenericText(name);
    
    component.appendChild(text);
    text.layoutSizingHorizontal = "FILL";
    
    this.adjustComponentY(component);
    
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
    text.layoutSizingVertical = "HUG";
    text.layoutSizingHorizontal = "HUG";
    
    component.layoutSizingHorizontal = "HUG";

    this.adjustComponentY(component);
    
    return component;
  }

  applyBorder(component:ComponentNode) {
    // Create a solid 1 pt border
    const border: SolidPaint = {
      type: "SOLID",
      color: { r: 0, g: 0, b: 0 }, // RGB values for black
    };

    // Set the strokes property of the frame to the solid border
    component.strokes = [border]
    component.strokeLeftWeight = 0;
    component.strokeBottomWeight = 0;
    component.strokeRightWeight = 0;
    component.strokeTopWeight = 1;

    return component;
  }

  async creategroupRowComponent(frame:FrameNode) {

    const component = this.initFigmaComponent(LOCALE.groupRow);
    
    component.primaryAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.counterAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.itemSpacing = 100;
    component.layoutSizingHorizontal = "HUG";
    component.paddingTop = 5;
    component.paddingBottom = 5;
    component.paddingLeft = 20;
    
    this.applyBorder(component);

    if(!this.groupTextComponent) this.groupTextComponent = await this.createGroupTextComponent();
    let instance = this.groupTextComponent.createInstance();
    
    component.appendChild(instance);
    instance.layoutSizingHorizontal = "HUG";
    instance.paddingTop = 20;
    (instance.children[0] as TextNode).characters = "Cell " + 1;
    
    component.resize(frame.width, component.height);
    
    this.adjustComponentY(component);
    
    return component;
  }

  async createModesRowComponent(collectionName:string, modes:{modeId:string, name:string}[], frame:FrameNode, count:number) {
    const component = this.initFigmaComponent(collectionName + ":" + LOCALE.modeRow);
    component.itemSpacing = 100;
    component.primaryAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.counterAxisAlignItems = "CENTER"; // Adjust alignment as needed
    
    component.paddingTop = 5;
    component.paddingBottom = 5;
    
    this.applyBorder(component);

    if(!this.modeTextComponent) this.modeTextComponent = await this.createModeTextComponent();
    let instance = this.modeTextComponent.createInstance();
    
    component.appendChild(instance);

    instance.layoutSizingHorizontal = "FILL";
    instance.layoutSizingVertical = "HUG";
    instance.paddingTop = 5;
    instance.paddingLeft = 20;
    
    (instance.children[0] as TextNode).characters = "Cell " + 1;
    
    for(let i = 0; i < modes.length; i++) {
      let instance = this.modeTextComponent.createInstance();
      (instance.children[0] as TextNode).characters = "Cell " + String(i + 2);
      component.appendChild(instance);
      instance.layoutSizingHorizontal = "FILL";
      instance.layoutSizingVertical = "HUG";
      instance.paddingTop = 5;
      instance.paddingLeft = 20;
      
    }
    
    component.resize(frame.width, component.height);
    
    this.adjustComponentY(component);
    
    return component;
  }

  async createGenericRowComponent(collectionName:string, modes:{modeId:string, name:string}[], frame:FrameNode, count:number) {
    const component = this.initFigmaComponent(collectionName + ":" + LOCALE.genericRow);
    
    component.counterAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.primaryAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.itemSpacing = 100;

    component.layoutSizingHorizontal = "HUG";
    component.layoutSizingVertical = "HUG";
    
    component.paddingTop = 20;
    component.paddingBottom = 20;
    component.paddingLeft = 20;
    
    this.applyBorder(component);

    if(!this.variableNameComponent) this.variableNameComponent = await this.createVariableNameTextComponent();
    if(!this.variableValueComponent) this.variableValueComponent = await this.createVariableValueTextComponent();

    let instance = this.variableNameComponent.createInstance();
    component.appendChild(instance);

    (instance.children[0] as TextNode).characters = "Name " + 1;

    instance.layoutSizingHorizontal = "FILL";
    instance.layoutSizingVertical = "HUG";
    
    for(let i = 0; i < modes.length; i++) {
      let instance = this.variableValueComponent.createInstance();
      (instance.children[0] as TextNode).characters = "Value " + String(i + 2);
      component.appendChild(instance);
      instance.layoutSizingHorizontal = "FILL";
      instance.layoutSizingVertical = "HUG";

    }

    component.resize(frame.width, component.height);
    
    this.adjustComponentY(component);

    return component;
  }

  async createColorCellComponent() {

    const component = this.initFigmaComponent(LOCALE.colorCell);
    
    component.primaryAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.counterAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.layoutSizingHorizontal = "HUG";
    component.itemSpacing = 20;
    component.paddingLeft = 5;
    
    const rect = figma.createRectangle()
    rect.resize(24,24);
    
    rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }];

    // Create a solid 1 pt border
    const border: SolidPaint = {
      type: "SOLID",
      color: { r: 0, g: 0, b: 0 }, // RGB values for black
    };

    // Set the strokes property of the frame to the solid border
    rect.strokes = [border]

    component.appendChild(rect);

    if(!this.variableNameComponent) this.variableNameComponent = await this.createVariableNameTextComponent();
    if(!this.variableValueComponent) this.variableValueComponent = await this.createVariableValueTextComponent();

    let instance = this.variableValueComponent.createInstance();
    component.appendChild(instance);
    instance.layoutSizingHorizontal = "FILL";
    instance.layoutSizingVertical = "HUG";
    
    (instance.children[0] as TextNode).characters = "Color Value " + 1;
    
    
    this.adjustComponentY(component);

    return component;
  }

  async createColorRowComponent(collectionName:string, modes:{modeId:string, name:string}[], frame:FrameNode, count:number) {
    const component = this.initFigmaComponent(collectionName + ":" + LOCALE.colorRowCell);
    
    component.primaryAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.counterAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.itemSpacing = 100;
    component.layoutSizingHorizontal = "HUG";
    component.layoutSizingVertical = "HUG";
    component.paddingTop = 20;
    component.paddingBottom = 20;
    component.paddingLeft = 20;
    
    this.applyBorder(component);

    if(!this.variableNameComponent) this.variableNameComponent = await this.createVariableNameTextComponent();
    if(!this.variableValueComponent) this.variableValueComponent = await this.createVariableValueTextComponent();

    let instance = this.variableNameComponent.createInstance();
    component.appendChild(instance);
    instance.layoutSizingHorizontal = "FILL";
    instance.layoutSizingVertical = "HUG";

    (instance.children[0] as TextNode).characters = "Color Name " + 1;
   
    for(let i = 0; i < modes.length; i++) {
      let colorCellInstance = this.colorCellComponent?.createInstance();
      
      if(colorCellInstance) {
        component.appendChild(colorCellInstance);
        colorCellInstance.layoutSizingHorizontal = "FILL";
        colorCellInstance.layoutAlign = "CENTER"
        colorCellInstance.layoutSizingVertical = "FILL"
      }
    }

    component.resize(frame.width, component.height);
    
    this.adjustComponentY(component);

    return component;
  }

  

  async createFrame(collection:VariableCollection, count:number) {
    let parent = figma.currentPage;

    const frame = figma.createFrame()
    frame.layoutMode = "VERTICAL"
    frame.primaryAxisAlignItems = "CENTER"; // Adjust alignment as needed

    frame.resize(FRAME_WIDTH, FRAME_HEIGHT);
    frame.x = FRAME_START_X + (frame.width - PADDING_LEFT - PADDING_RIGHT + 100) * count;
    frame.y = baseY;
    frame.paddingRight = PADDING_RIGHT;
    frame.paddingTop = PADDING_TOP;
    frame.layoutSizingVertical = "HUG";

    frame.name = collection.name;

    parent.appendChild(frame);

    return frame;
  }

  async createCollectionHeading(collection:VariableCollection, parent:FrameNode) {

    let instance = this.collectionRowComponent?.createInstance();
    if(instance) {
      (instance.children[0] as TextNode).characters = collection.name;
      parent.appendChild(instance);
    }
  }

  async createModesHeading(modes:{modeId:string, name:string}[], parent:FrameNode) {

    let instance = this.modesRowComponent?.createInstance();
    
    if(instance) {
      let modeComponent: InstanceNode = (instance.children[0] as InstanceNode);
      let textNode =modeComponent.children[0] as TextNode;
      textNode.characters = "Name";

      for(let i = 0; i < modes.length; i++) {
        let mode = modes[i];
        let modeComponent: InstanceNode = (instance.children[i+1] as InstanceNode);
        let textNode = modeComponent.children[0] as TextNode;//instance.children[i + 1] as TextNode;
        
        textNode.characters = mode.name;
      }

      parent.appendChild(instance);
      instance.layoutSizingHorizontal = "FIXED";
      instance.primaryAxisAlignItems = "CENTER";
      instance.itemSpacing = 100;
    }

    return instance;
  }

  async createGroup(groupName:string, modes:{modeId:string, name:string}[], parent:FrameNode) {
    if(!this.groupRowComponent) this.groupRowComponent = await this.creategroupRowComponent(parent);
    let instance = this.groupRowComponent?.createInstance();
    if(instance) {

      let textNode = (instance.children[0] as InstanceNode).children[0] as TextNode;
      textNode.characters = groupName;

      parent.appendChild(instance);
      instance.layoutSizingHorizontal = "FILL";
      instance.layoutSizingVertical = "HUG";
      instance.layoutAlign = "INHERIT";
      instance.primaryAxisAlignItems = "MIN";
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
    //this.groupRowComponent             = await this.creategroupRowComponent();
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
