export type TaskFunction = () => void;
/**
 * Queues a DOM task to run in the current batch of tasks.
 *
 * If there is not yet a batch of tasks running, it will run the task
 * immediately. If there is a batch of tasks running, it will queue the task to
 * run in DOM order after the current task completes.
 */
export declare const postDOMTask: (node: Node, task: TaskFunction) => void;
/**
 * Queues a DOM task to run in a future microtask.
 */
export declare const postDomTaskAsync: (node: Node, task: TaskFunction) => void;
//# sourceMappingURL=index.d.ts.map