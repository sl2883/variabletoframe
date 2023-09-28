// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

let PADDING_LEFT:number = 20;let PADDING_RIGHT:number = 20;
let PADDING_TOP:number = 20;let PADDING_BOTTOM:number = 20;
let PADDING_LEFT_TEXT:number = 20;let PADDING_RIGHT_TEXT:number = 20;

let FRAME_WIDTH:number = 1280;
let FRAME_HEIGHT:number = 720;
let FRAME_START_X: number = 1280 + 100;
let FRAME_START_Y: number = 500;

let currentY = 0;

enum NODE_TYPE {
  COLLECTION_NODE,
  MODE_NODE,
  VARIABLE_NAME,
  VARIABLE_VALUE
}


// This shows the HTML page in "ui.html".
figma.showUI(__html__);

class Position {
  // Properties
  x: number;
  y: number;
  
  // Constructor
  constructor(x:number, y:number) {
   this.x = x;
   this.y = y;
  }
}

class VariablesManager {

  modes: {[key:string]: any};
  collectionHeadingComponent: ComponentNode | null;
  rowsComponent: ComponentNode | null;
  colorRowsComponent: ComponentNode | null;
  colorCellComponent: ComponentNode | null;
  modesComponent: ComponentNode | null;

  constructor() {
    this.collectionHeadingComponent = null;
    this.rowsComponent = null;
    this.modesComponent = null;
    this.colorRowsComponent = null;
    this.colorCellComponent = null;
    this.modes = {}
  }

   rgbToHex(value:any) {
    let { r, g, b, a } = value;
    console.log(r, g, b, a)
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

  async createCollectionComponent(name:string) {
    const component = figma.createComponent();
    component.x = 0;
    component.y = 0;
    component.name = "Collection Name";
    let textNode = await this.createTextNode(name, NODE_TYPE.COLLECTION_NODE);
    component.appendChild(textNode);
    currentY = component.y + component.height;
    
    return component;
  }

  async createTextNode(name:string, variableType:number) {
    const text = figma.createText();

    // Load the font in the text node before setting the characters
    // console.log('loading font', node.fontName)
    await figma.loadFontAsync({
      family: (text.fontName as FontName).family,
      style: (text.fontName as FontName).style,
    });

    let mono = await figma.loadFontAsync({
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

  async createModesComponent(collectionName:string, modes:{modeId:string, name:string}[], frame:FrameNode, count:number) {

    const component = figma.createComponent();
    component.name = "Mode Row Component:" + collectionName +":" + String(count);
    component.layoutMode = "HORIZONTAL";
    component.primaryAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.itemSpacing = 100;
    component.layoutSizingHorizontal = "HUG";
    component.paddingTop = 20;
    component.paddingLeft = 20;
    
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


    let textNode = await this.createTextNode("name", NODE_TYPE.MODE_NODE);
    component.appendChild(textNode);
    textNode.characters = "Cell " + 1;
    (component.children[0] as TextNode).layoutSizingHorizontal = "FILL";
    
    for(let i = 0; i < modes.length; i++) {
      let textNode = await this.createTextNode(modes[i].name, NODE_TYPE.MODE_NODE);
      textNode.characters = "Cell " + String(i + 2);
      component.appendChild(textNode);
      (component.children[i+1] as TextNode).layoutSizingHorizontal = "FILL";
    }

    component.resize(frame.width, component.height);
    
    component.x = 0;
    component.y = 100 + currentY;
    currentY = component.y + component.height;

    return component;
  }

  async createRowsComponent(collectionName:string, modes:{modeId:string, name:string}[], frame:FrameNode, count:number) {

    const component = figma.createComponent();
    component.name = "Row Component:" + collectionName +":" + String(count);
    component.layoutMode = "HORIZONTAL";
    component.primaryAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.itemSpacing = 100;
    component.layoutSizingHorizontal = "HUG";
    component.paddingTop = 20;
    component.paddingLeft = 20;
    
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


    let textNode = await this.createTextNode("name", NODE_TYPE.VARIABLE_NAME);
    component.appendChild(textNode);
    textNode.characters = "Cell " + 1;
    (component.children[0] as TextNode).layoutSizingHorizontal = "FILL";
    
    for(let i = 0; i < modes.length; i++) {
      let textNode = await this.createTextNode(modes[i].name, NODE_TYPE.VARIABLE_VALUE);
      textNode.characters = "Cell " + String(i + 2);
      component.appendChild(textNode);
      (component.children[i+1] as TextNode).layoutSizingHorizontal = "FILL";
    }

    component.resize(frame.width, component.height);
    
    component.x = 0;
    component.y = 100 + currentY;
    currentY = component.y + component.height;

    return component;
  }

  async createColorCellComponent() {

    const component = figma.createComponent();
    
    component.name = "Color Cell Component";
    component.layoutMode = "HORIZONTAL";
    
    component.primaryAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.counterAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.layoutSizingHorizontal = "HUG";
    component.itemSpacing = 20;
    component.paddingTop = 5;
    component.paddingBottom = 20;
    component.paddingLeft = 5;
    component.layoutAlign = "CENTER";
    
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

    let textNode = await this.createTextNode("name", NODE_TYPE.VARIABLE_VALUE);
    component.appendChild(textNode);
    textNode.characters = "Color value";
    (component.children[1] as TextNode).layoutSizingHorizontal = "FILL";
    
    component.x = 0;
    component.y = 100 + currentY;
    currentY = component.y + component.height;
    return component;
  }

  async createColorRowsComponent(collectionName:string, modes:{modeId:string, name:string}[], frame:FrameNode, count:number) {

    const component = figma.createComponent();
    component.name = "Color Row Component:" + collectionName +":" + String(count);
    component.layoutMode = "HORIZONTAL";
    component.primaryAxisAlignItems = "CENTER"; // Adjust alignment as needed
    component.itemSpacing = 100;
    component.layoutSizingHorizontal = "HUG";
    component.layoutSizingVertical = "HUG";
    component.paddingTop = 20;
    component.paddingLeft = 20;
    
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


    let textNode = await this.createTextNode("name", NODE_TYPE.VARIABLE_NAME);
    component.appendChild(textNode);
    textNode.characters = "Cell " + 1;
    (component.children[0] as TextNode).layoutSizingHorizontal = "FILL";
    (component.children[0] as TextNode).layoutSizingVertical = "FILL";
    (component.children[0] as TextNode).textAlignVertical = "TOP";
    
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
    
    component.y = 100 + currentY;
    currentY = component.y + component.height;

    return component;
  }

  

  async createFrame(collection:VariableCollection, count:number) {
    let parent = figma.currentPage;

    const frame = figma.createFrame()
    frame.layoutMode = "VERTICAL"
    frame.primaryAxisAlignItems = "CENTER"; // Adjust alignment as needed

    frame.resize(FRAME_WIDTH, FRAME_HEIGHT);
    frame.x = FRAME_START_X + (frame.width - PADDING_LEFT - PADDING_RIGHT + 100) * count;
    frame.paddingRight = PADDING_RIGHT;
    frame.paddingTop = PADDING_TOP;
    frame.layoutSizingVertical = "HUG";

    frame.name = collection.name;

    parent.appendChild(frame);

    return frame;
  }

  async createCollectionHeading(collection:VariableCollection, parent:FrameNode) {

    let instance = this.collectionHeadingComponent?.createInstance();
    if(instance) {
      (instance.children[0] as TextNode).characters = collection.name;
      parent.appendChild(instance);
    }
  }

  async createModesHeading(modes:{modeId:string, name:string}[], parent:FrameNode) {

    let instance = this.modesComponent?.createInstance();
    console.log("mode instance:", instance);
    if(instance) {

      let textNode = instance.children[0] as TextNode;
      textNode.characters = "Name";

      for(let i = 0; i < modes.length; i++) {
        let mode = modes[i];
        let textNode = instance.children[i + 1] as TextNode;
        textNode.characters = mode.name;
      }
      parent.appendChild(instance);
    }

    return instance;
  }

  async addVariableNameToInstance(instance:InstanceNode, variable:Variable) {
    let textNode:TextNode = instance.children[0] as TextNode;
    console.log("Variable: ", variable, variable.name);
    textNode.characters = variable.name;
  }

  async appendRowForColor(variable:Variable, parent:FrameNode, variables:{[key:string]: any}) {
    
    let instance = this.colorRowsComponent?.createInstance();
    console.log("color row instance", instance);
    if(instance) {
      this.addVariableNameToInstance(instance, variable);
      let index = 1;
      if(variable.valuesByMode) {
        for (const key in variable.valuesByMode) {
          if (variable.valuesByMode.hasOwnProperty(key)) {
            const value:any = variable.valuesByMode[key];

            let colorNode = instance.children[index++] as InstanceNode;
             (colorNode.children[0] as any).fills = [{ type: 'SOLID', color: { r: value.r, g: value.g, b: value.b} }];
             (colorNode.children[0] as any).opacity = value.a;
             (colorNode.children[1] as any).characters = this.rgbToHex(value).toUpperCase();
          }
        }
      }
      parent.appendChild(instance);
    }

    return instance;
  }

  async appendRowForOthers(variable:Variable, parent:FrameNode, variables:{[key:string]: any}) {
    let instance = this.rowsComponent?.createInstance();
    if(instance) {
      this.addVariableNameToInstance(instance, variable);
      let index = 1;
      if(variable.valuesByMode) {
        for (const key in variable.valuesByMode) {
          if (variable.valuesByMode.hasOwnProperty(key)) {
            const value:any = variable.valuesByMode[key];
            let textNode = instance.children[index++] as TextNode;
            
            if(value["type"] && value["type"] === "VARIABLE_ALIAS") {
              textNode.characters = variables[value.id].name;
            }
            else if(variable.resolvedType === "FLOAT" || variable.resolvedType === "BOOLEAN" || variable.resolvedType === "STRING") {
              textNode.characters = String(value);
            }
            else {
              console.log("SOMETHING WRONG: ", variable, value);
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

  async printVariable(variable:Variable, parent:FrameNode, variables: {[key:string]: any}) {
    return this.createVariableRow(variable, parent, variables);
  }

  async processCollection(collection: VariableCollection, count:number) {
    let variables: {[key:string]: any} = {};
    let { name, modes, variableIds } = collection;

    variableIds.forEach((variableId) => {
      let variable  = figma.variables.getVariableById(variableId);
      if(variable) {

        variables[variableId] = variable;
      }
    });
    
    let frame               = await this.printCollection(collection, count);
    this.rowsComponent      = await this.createRowsComponent(collection.name, modes, frame, count);
    this.modesComponent     = await this.createModesComponent(collection.name, modes, frame, count);
    this.colorRowsComponent = await this.createColorRowsComponent(collection.name, modes, frame, count);
    
    await this.printModes(modes, frame);

    variableIds.forEach((variableId) => {
      let variable  = figma.variables.getVariableById(variableId);
      if(variable) {

        this.printVariable(variable, frame, variables);

        variables[variableId] = variable;

        const { id, name, resolvedType, valuesByMode } = variable;
        //const value:any = valuesByMode[mode.modeId];
        //console.log("id", id, "name:", name, "resolvedType:", resolvedType, "valuesByMode", valuesByMode);
      }
    });
  }
  
  async read() {
    //const collection = figma.variables.getVariableCollectionById('VariableCollectionId:257c3beb2/57:13');
    //  const localVariables = figma.variables.getLocalVariables('STRING'); // filters local variables by the 'STRING' type
    //const variable = figma.variables.getVariableById(variableId);
    //const collection = figma.variables.createVariableCollection('Example Collection');
    const collections = figma.variables.getLocalVariableCollections();

    this.collectionHeadingComponent = await this.createCollectionComponent("Collection Name Component");
    this.colorCellComponent         = await this.createColorCellComponent();

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

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  //figma.closePlugin();
};
