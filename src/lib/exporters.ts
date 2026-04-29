import type {
  Sensor,
  Observer,
  Task,
  IncompatibilityLink,
  SuccessionArrow,
  SuccessionNode,
} from './database.types';
import { analyzeExpression } from './expressionParser';

const CONTROLER_NAME = 'Controler';
const PHYSICAL_SYSTEM_NAME ='PhysicalSystem';
const SUBDEFINED_SYSTEM_NAME = 'SubDefinedSystem';
const SYSTEM_NAME = 'PB';
const PROBLEM_NAME = 'TemplateOfAProblem';

const DEPS_MODELS = {
  AND: 'OpAnd',
  OR: 'OpOr',
  XOR: 'OpXor',
  NOT: 'OpNot',
  UP: 'OpUp',
  DOWN: 'OpDown',
};

/**
 * Transforme une expression textuelle en suite d'opérations DEPS
 * Exemple: "A AND B OR C" -> ["Op1 : ModelAND(A, B)", "Op2 : ModelOR(Op1, C)"]
 */
function decomposeLogic(expr: string, prefix: string): { lines: string[], finalVar: string } {
  if (!expr || expr.toUpperCase() === 'TRUE' || expr === '') {
    return { lines: [], finalVar: 'true' };
  }
  return { 
    lines: [` (* Hierarchical decomposition for ${prefix} pending official model names *) `], 
    finalVar: expr 
  };
}

/**
 * Transforme une expression en suite d'opérations binaires pour DEPS
 */
function buildDepsHierarchy(expr: string, allNames: string[], prefix: string): { elements: string, finalVar: string } {
  const result = analyzeExpression(expr, allNames);
  const tokens = (result.tokens || []).filter(t => t.type !== 'WHITESPACE');
  if (!result.isValid || tokens.length === 0) {
    return { elements: "", finalVar: "true" };
  }

  let elements = "";
  let opCount = 1;
  const precedence: { [key: string]: number } = {
    'OR': 1, 'XOR': 1,
    'AND': 2,
    '>': 3, '<': 3, '=': 3, '!=': 3, '>=': 3, '<=': 3,
    'NOT': 4, '↑': 4, '↓': 4
  };

  const outputQueue: string[] = [];
  const opStack: string[] = [];
  
  const generateOp = (op: string, val1: string, val2?: string) => {
    const id = `${prefix}_Op${opCount++}`;
    let model = "";
    const isVal2Numeric = val2 && /^\d+$/.test(val2);

    if (isVal2Numeric) {
      const num = val2;
      if (op === '=')  model = `ObserverEqual${num}`;
      else if (op === '>')  model = `ObserverAbove${num}`;
      else if (op === '<')  model = `ObserverBelow${num}`;
      else if (op === '>=') model = `ObserverAboveEqual${num}`;
      else if (op === '<=') model = `ObserverBelowEqual${num}`;
      else if (op === '!=') model = `ObserverNotEqual${num}`;
      else model = 'ObserverUnknown';

      elements += `    ${id} : ${model} (${val1});\n`;
      return id;
    }
    
    switch(op) {
      case 'AND': model = DEPS_MODELS.AND; break;
      case 'OR':  model = DEPS_MODELS.OR; break;
      case 'XOR': model = DEPS_MODELS.XOR; break;
      case 'NOT': model = DEPS_MODELS.NOT; break;
      case '↑':   model = DEPS_MODELS.UP; break;
      case '↓':   model = DEPS_MODELS.DOWN; break;
      default:    model = 'OpUnknown';
    }

    if (val2) {
      elements += `    ${id} : ${model} (${val1}, ${val2});\n`;
    } else {
      elements += `    ${id} : ${model} (${val1});\n`;
    }
    return id;
  };

  const processOpFromStack = () => {
    const op = opStack.pop()!;
    if (['NOT', '↑', '↓'].includes(op)) {
      const v1 = outputQueue.pop()!;
      outputQueue.push(generateOp(op, v1));
    } else {
      const v2 = outputQueue.pop()!;
      const v1 = outputQueue.pop()!;
      outputQueue.push(generateOp(op, v1, v2));
    }
  };

  tokens.forEach(t => {
    if (t.type === 'ID') {
      outputQueue.push(t.value);
    } else if (['(', '['].includes(t.value)) {
      opStack.push(t.value);
    } else if ([')', ']'].includes(t.value)) {
      while (opStack.length > 0 && !['(', '['].includes(opStack[opStack.length - 1])) {
        processOpFromStack();
      }
      opStack.pop(); 
    } else {
      while (opStack.length > 0 && precedence[opStack[opStack.length - 1]] >= precedence[t.value]) {
        processOpFromStack();
      }
      opStack.push(t.value);
    }
  });

  while (opStack.length > 0) processOpFromStack();

  return { elements, finalVar: outputQueue[0] || "TRUE" };
}

export function generateDEPS(
  sensors: Sensor[],
  observers: Observer[],
  tasks: Task[],
  incompatibilityLinks: IncompatibilityLink[],
  successionArrows: SuccessionArrow[],
  successionNodes: SuccessionNode[]
): string {
  let deps = 'Package ControlerSynthesisProblem ;\n \n Uses ControlerSynthesisGeneric,ControlerSynthesisSimpleTask,ControlerSynthesisIncompatibilityConstraints,ControlerSynthesisSuccessionConstraintsV3 \n, ControlerSynthesisBooleanSensor,ControlerSynthesisIntegerSensor,ControlerSynthesisObserverGeneric,ControlerSynthesisObserverOnBooleanSensor,ControlerSynthesisObserverOnIntegerSensor, \n ControlerSynthesisReactivableTask,ControlerSynthesisBinaryIntegerNumber,ControlerSynthesisCounter,ControlerSynthesisObserverCounter,ControlerSynthesisBooleanOperatorGeneric, \n ControlerSynthesisOperatorToTask,ControlerSynthesisOperatorToReactivableTask,ControlerSynthesisOperatorToIntegerSensor,ControlerSynthesisIntegerOperatorGeneric; \n \n (*Auto-generated from Controller Synthesis Tool*)\n \n';

  /*========Sensors==== Physical System =========*/
  deps += 'Model PhysicalSystem( ) extends AbstractPhysicalSystem[]\n Constants \n Variables \n Elements \n';
  deps += ` true : SensorAlwaysTrueValue();\n`;
  
  sensors.forEach((sensor) => {
    deps += ` ${sensor.name} : Sensor${sensor.type}(); (*on_machine "${sensor.machine}"*)\n`;
  });
  tasks.forEach((task) => {
    if (task.final_condition === 'AUTO') {
      deps += ` F${task.name} : SensorBoolean(); (*end of task "${task.name}"*)\n`;
    }
  })
  deps += '  \n Properties\nEnd\n \n';


  /*========Tasks and Observers==== Controler =========*/
  deps += `Model Controler() extends AbstractControler[AbstractPhysicalSystem[]]\n Constants \n Variables \n Elements \n ${PHYSICAL_SYSTEM_NAME} : PhysicalSystem[]; redefine; \n`;
  deps += '\n(* ========== TASK ========== *)\n';
  tasks.forEach((task) => {
    if (task.type.includes('reactivable')) {
      deps += ` ${task.name} : TaskReactivable();\n`;
    } else {
      deps += ` ${task.name} : Task();\n`;
    }
  });
  
  deps += '\n(* ========== OBSERVERS ========== *)\n';
  
  deps += ` true : ObserverE(${PHYSICAL_SYSTEM_NAME}.true);\n`;
  deps += ` false : ObserverN(${PHYSICAL_SYSTEM_NAME}.true);\n`;
  
  sensors.forEach((sensor) => {
    if (sensor.type === 'Boolean') {
      deps += ` ${sensor.name} : ObserverE(${PHYSICAL_SYSTEM_NAME}.${sensor.name});\n`;
      deps += ` Not${sensor.name} : ObserverN(${PHYSICAL_SYSTEM_NAME}.${sensor.name});\n`;
    }
    /* Need to do the leftovers of others observer of sensor : Interger and Reeeal*/
  });
  tasks.forEach((task) => {
    if (task.final_condition === 'AUTO') {
      deps += ` F${task.name} : ObserverE(${PHYSICAL_SYSTEM_NAME}.F${task.name}); (*end of task "${task.name}"*)\n`;
    }
  })
  const allNames = [...sensors.map(s => s.name), ...observers.map(o => o.name), ...tasks.map(t => t.name), 'TRUE', 'FALSE', 'AUTO'];

  observers.forEach((observer) => {
    deps += `\n    (* Logic for Observer ${observer.name} *)\n`;
    const exprs = observer.expressions as any;

    if (observer.type === 'expression') {
      const h = buildDepsHierarchy(exprs.main, allNames, `${observer.name}_Logic`);
      deps += h.elements;
      deps += `    ${observer.name}: ObserverE(${h.finalVar});\n`;
    } 
    else if (observer.type === 'counter') {
      const hInc = buildDepsHierarchy(exprs.increase, allNames, `${observer.name}_Inc`);
      const hDec = buildDepsHierarchy(exprs.decrease, allNames, `${observer.name}_Dec`);
      const hRes = buildDepsHierarchy(exprs.reset, allNames, `${observer.name}_Res`);
      deps += hInc.elements + hDec.elements + hRes.elements;
      deps += `    ${observer.name}: ObserverCounter(${hInc.finalVar}, ${hDec.finalVar}, ${hRes.finalVar});\n`;
    } 
    else if (observer.type === 'jk_flip_flop') {
      const hSet = buildDepsHierarchy(exprs.set, allNames, `${observer.name}_Set`);
      const hRes = buildDepsHierarchy(exprs.reset, allNames, `${observer.name}_Res`);
      deps += hSet.elements + hRes.elements;
      deps += `    ${observer.name}: ObserverJK(${hSet.finalVar}, ${hRes.finalVar});\n`;
    }
  });

  deps += '\n(* ========== SUCCESSION ARROWS (Memory) ========== *)\n';
  successionArrows.forEach((arrow, idx) => {
    if (arrow.from_type === 'task') {
      const task = tasks.find((t) => t.id === arrow.from_id);
      deps += `    Arrow${idx} : SuccessionArrowEndOfTask(${task?.name || 'unknown'});\n`;
    } else {
      deps += `    Arrow${idx} : SuccessionArrowOfSuccessionConstraint();\n`;
    }
  });
    
  deps += ' Properties\nEnd\n \n';

  
  /*========= REQUIREMENT ==========*/
  deps += `Model Requirement() extends AbstractRequirement[AbstractControler[AbstractPhysicalSystem[]]]\n Constants \n Variables \n Elements \n ${CONTROLER_NAME} : Controler[PhysicalSystem[]]; redefine; \n`;
  deps += '\n(* ========== INTER-TASK CONSTRAINT ========== *)\n';
  tasks.forEach((task) => {
    const authH = buildDepsHierarchy(task.authorization_expression, allNames, `${task.name}_Auth`);
    deps += `\n    (* Logic for ${task.name} *)\n`;
    deps += authH.elements;
    deps += `    ${task.name}InitialCondition : InitialCondition(${CONTROLER_NAME}.${authH.finalVar}, ${CONTROLER_NAME}.${task.name}); \n`;
    if (task.final_condition !== 'AUTO' && task.final_condition !== '') {
      const finalH = buildDepsHierarchy(task.final_condition, allNames, `${task.name}_Fin`);
      deps += finalH.elements;
      deps += `    ${task.name}FinalCondition : FinalCondition(${CONTROLER_NAME}.${finalH.finalVar}, ${CONTROLER_NAME}.${task.name});\n`;
    } else {
      deps += `    ${task.name}FinalCondition : FinalCondition(${CONTROLER_NAME}.F${task.name}, ${CONTROLER_NAME}.${task.name});\n`;
    }
    
    if (task.type.includes('reactivable')) {
      deps += `    ${task.name}MaxActivation : MaxActivation${task.max_simultaneous_executions}(${CONTROLER_NAME}.${task.name});\n`;
    }
    deps += '\n';
  });
  
  deps += '\n(* ========== INCOMPATIBILITIES ========== *)\n';
  incompatibilityLinks.forEach((link, idx) => {
    const groupTaskNames = (link.task_ids || [])
      .map(id => tasks.find(t => t.id === id)?.name)
      .filter(Boolean);
    if (groupTaskNames.length >= 2) {
      deps += ` GroupIncompatible${idx} : IncompatibleSet([${groupTaskNames.map(name => `${CONTROLER_NAME}.${name}`).join(', ')}]);\n`;
    }
  });

  deps += '\n(* ========== SUCCESSION CONSTRAINTS ========== *)\n';
  
  
  successionNodes.forEach((node, idx) => {
    const nodeName = node.name || `node${idx}`;
    const h = buildDepsHierarchy(node.expression, allNames, `${nodeName}_Guard`);
    deps += `\n    (* Logic for Node ${nodeName} *)\n`;
    deps += h.elements;
    
    let inArrows = [];
    let outArrows = [];
    successionArrows.forEach((arrow, aIdx) => {
      if (arrow.to_id === node.id) inArrows.push(`Arrow${aIdx}`);
      if (arrow.from_id === node.id) outArrows.push(`Arrow${aIdx}`);
    });
    
    let modelName = 'SuccessionNodeAll';
    if (node.split_type === 'only_one') modelName = 'SuccessionNodeOnlyOne';
    if (node.split_type === 'none') modelName = 'SuccessionNodeSimple';


    deps += `    ${nodeName} : ${modelName}`;
    if (h.finalVar !== "TRUE") {
      deps += `(logic := ${h.finalVar})`; 
    }
    
    const inStr = inArrows.join(', ');
    const outStr = outArrows.join(', ');
    deps += `(${inStr}${inStr ? ', ' : ''}0${outStr ? ', ' : ''}${outStr}); \n`; 
  });

  tasks.forEach((task) => {
    deps +=` ${task.name}SuccessionContraint : SuccessionContraint(${CONTROLER_NAME}.${task.name}`;
    successionArrows.forEach((arrow,idx) => {
      if (arrow.to_id === task.id) {
        deps += `,${CONTROLER_NAME}.Arrow${idx}`;
      }   
    })
    deps +=`); \n`;
  })
  deps += '  \n Properties\n'
  let listofoptimisations ='';
  let listoftasks='';
  deps +=`\n`;
  tasks.forEach((task,idx) => {
    if (idx ===0) {
      listofoptimisations+=`max`;
      listoftasks+=`${CONTROLER_NAME}.${task.name}.Aut`;
    } else {
      listofoptimisations+=`,max`;
      listoftasks+=`,${CONTROLER_NAME}.${task.name}.Aut`;
    }     
  })
  deps +=`Blo ([${listofoptimisations}],[${listoftasks}]);\n`;
  
  deps += 'End\n \n';


  deps += 'Model SubDefinedSystem() extends AbstractSubDefinedSystem[] \n Constants\n Variables\n Elements\n';
  deps += ` ${PHYSICAL_SYSTEM_NAME} : PhysicalSystem(); redefine; \n ${CONTROLER_NAME} : Controler(${PHYSICAL_SYSTEM_NAME}); redefine;\n`;
  deps += ' \n Properties\nEnd\n\n';

  deps += 'Model System() extends AbstractSystem[] \n Constants\n Variables\n Elements\n';
  deps += ` ${SUBDEFINED_SYSTEM_NAME} : SubDefinedSystem(); redefine;\n Requirement : Requirement (${SUBDEFINED_SYSTEM_NAME}.${CONTROLER_NAME}); redefine; \n`;
  deps += ' \n Properties\nEnd\n\n';

  deps += `Problem ${PROBLEM_NAME}\n Constants\n Variables\n Elements\n`;
  deps += `${SYSTEM_NAME} : System(); \n`
  deps += ' \n Properties\nEnd\n\n';
  return deps;
}

export function generateGRAFCET(tasks: Task[], successionArrows: SuccessionArrow[]): string {
  let grafcet ='<?xml version="1.0" encoding="UTF-8"?>\n<project>\n'
  tasks.forEach((task) => {
    grafcet +=`	<grafcet type="normal" owner="" name="GMemorisation${task.name}" comment="">\n`;
    grafcet +='		<sequence id="1">\n'
    grafcet +=`			<step type="initial" name="XOFF${task.name}"/>\n`;
    grafcet +=`			<transition>\n				<condition>${task.name}T</condition>\n			</transition>\n`;
    grafcet +=`			<step type="normal" name="${task.name}prevT" />\n`;
    grafcet +=`			<transition>\n				<condition><cpl>${task.name}T</cpl></condition>\n			</transition>\n`;
    grafcet +=`		</sequence>\n`;
    grafcet +=`		<jump seqid_from="1" seqid_to="1" />\n`;
    grafcet +=`	</grafcet>\n`;
  })
 successionArrows.forEach((arrow,idx) => {
    grafcet +=`	<grafcet type="normal" owner="" name="GMemorisationArrow${idx}" comment="">\n`;
    grafcet +='		<sequence id="1">\n'
    grafcet +=`			<step type="initial" name="XOFFArrow${idx}"/>\n`;
    grafcet +=`			<transition>\n				<condition>Arrow${idx}NextValue</condition>\n			</transition>\n`;
    grafcet +=`			<step type="normal" name="Arrow${idx}PrevValue" />\n`;
    grafcet +=`			<transition>\n				<condition><cpl>Arrow${idx}Value</cpl></condition>\n			</transition>\n`;
    grafcet +=`		</sequence>\n`;
    grafcet +=`		<jump seqid_from="1" seqid_to="1" />\n`;
    grafcet +=`	</grafcet>\n`;
  })
  grafcet +='</project>\n';
  
  return grafcet; 
}

export function downloadFile(content: string, filename: string) {
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}