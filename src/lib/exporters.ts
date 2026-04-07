import type {
  Sensor,
  Observer,
  Task,
  IncompatibilityLink,
  SuccessionArrow,
  SuccessionNode,
} from './database.types';

export function generateDEPS(
  sensors: Sensor[],
  observers: Observer[],
  tasks: Task[],
  incompatibilityLinks: IncompatibilityLink[],
  successionArrows: SuccessionArrow[],
  successionNodes: SuccessionNode[]
): string {
  let deps = '/*\n * DEPS Model\n * Auto-generated from Controller Synthesis Tool\n */\n\n';

  deps += '/* ========== SENSORS ========== */\n';
  sensors.forEach((sensor) => {
    if (sensor.factory_io_address) {
      deps += `/* MAPPING Factory I/O: ${sensor.factory_io_address} */\n`;
    }
    deps += `sensor ${sensor.name}: ${sensor.type} on_machine "${sensor.machine}";\n`;
  });

  deps += '\n/* ========== OBSERVERS ========== */\n';
  observers.forEach((observer) => {
    if (observer.type === 'expression') {
      const exprs = observer.expressions as { main?: string };
      deps += `observer ${observer.name}: expression = ${exprs.main || 'true'};\n`;
    } else if (observer.type === 'counter') {
      const exprs = observer.expressions as { increase?: string; decrease?: string };
      deps += `observer ${observer.name}: counter\n`;
      deps += `  increase = ${exprs.increase || 'false'}\n`;
      deps += `  decrease = ${exprs.decrease || 'false'};\n`;
    } else if (observer.type === 'jk_flip_flop') {
      const exprs = observer.expressions as { set?: string; reset?: string };
      deps += `observer ${observer.name}: jk_flip_flop\n`;
      deps += `  set = ${exprs.set || 'false'}\n`;
      deps += `  reset = ${exprs.reset || 'false'};\n`;
    }
  });

  deps += '\n/* ========== TASKS ========== */\n';
  tasks.forEach((task) => {
    if (task.factory_io_address) {
      deps += `/* MAPPING Factory I/O: ${task.factory_io_address} */\n`;
    }
    deps += `task ${task.name}\n`;
    deps += `  types = [${task.type.join(', ')}]\n`;
    deps += `  priority = ${task.priority}\n`;
    deps += `  authorization = ${task.authorization_expression || 'true'}\n`;
    deps += `  final_condition = ${task.final_condition}\n`;
    if (task.type.includes('reactivable')) {
      deps += `  max_simultaneous_executions = ${task.max_simultaneous_executions}\n`;
    }
    deps += ';\n';
  });

  deps += '\n/* ========== INCOMPATIBILITIES ========== */\n';
  incompatibilityLinks.forEach((link) => {
    const task1 = tasks.find((t) => t.id === link.task1_id);
    const task2 = tasks.find((t) => t.id === link.task2_id);
    if (task1 && task2) {
      deps += `incompatible ${task1.name} <-> ${task2.name};\n`;
    }
  });

  deps += '\n/* ========== SUCCESSION CONSTRAINTS ========== */\n';
  successionNodes.forEach((node, idx) => {
    deps += `node_${idx}\n`;
    deps += `  expression = ${node.expression || 'true'}\n`;
    deps += `  split_type = ${node.split_type}\n`;
    deps += ';\n';
  });

  successionArrows.forEach((arrow) => {
    let fromLabel = '';
    let toLabel = '';

    if (arrow.from_type === 'task') {
      const task = tasks.find((t) => t.id === arrow.from_id);
      fromLabel = task?.name || 'unknown';
    } else {
      const node = successionNodes.find((n) => n.id === arrow.from_id);
      fromLabel = `node_${successionNodes.indexOf(node || {} as SuccessionNode)}`;
    }

    if (arrow.to_type === 'task') {
      const task = tasks.find((t) => t.id === arrow.to_id);
      toLabel = task?.name || 'unknown';
    } else {
      const node = successionNodes.find((n) => n.id === arrow.to_id);
      toLabel = `node_${successionNodes.indexOf(node || {} as SuccessionNode)}`;
    }

    deps += `precedence ${fromLabel} -> ${toLabel};\n`;
  });

  return deps;
}

export function generateGRAFCET(tasks: Task[], successionArrows: SuccessionArrow[]): string {
  let grafcet = 'graph grafcet {\n';
  grafcet += '  rankdir=TB;\n';
  grafcet += '  node [shape=box, style=rounded];\n\n';

  grafcet += '  /* Steps */\n';
  tasks.forEach((task) => {
    let label = task.name;
    if (task.factory_io_address) {
      label += `\\n[${task.factory_io_address}]`;
    }
    if (task.type.includes('reactivable')) {
      label += ` (max: ${task.max_simultaneous_executions})`;
    }
    grafcet += `  "${task.id}" [label="${label}", color=`;
    if (task.type.includes('pausable')) grafcet += 'yellow';
    else if (task.type.includes('interruptible')) grafcet += 'red';
    else grafcet += 'lightblue';
    grafcet += '];\n';
  });

  grafcet += '\n  /* Transitions and Precedences */\n';
  successionArrows.forEach((arrow) => {
    let fromId = arrow.from_id;
    let toId = arrow.to_id;
    grafcet += `  "${fromId}" -> "${toId}";\n`;
  });

  grafcet += '}\n';
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

const escapeSqlString = (str: string | null | undefined) => {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
};

const escapeSqlJson = (obj: any) => {
  if (!obj) return 'NULL';
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
};
