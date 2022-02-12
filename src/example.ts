// this example uses algebraic effects
// to pass the tasks over to the caller
// this allows the parent function to change the
// behavior of the child function
// without passing arguments to it
//
// this is somewhat similar to the model that react uses for <Suspense />,
// where it throws a `Promise` up the call stack
//
// except rather than just passing async tasks to the parent and asking
// it to recall the child once its done completing the task,
// this also allows us to ask the parent to send data back to it
//
// `AsyncLocalStorage` also allows to resume the function exactly where it paused
// rather than call it from the top again, like react does
//
// this also allows a sort of dependency injection where all the functions
// called inside the effect can ask the parent to call an effect by name
// without knowing the implementation detail of the task
// which could be helpful in mocking external requests
// or computational functions in unit tests
//
// Example from [https://overreacted.io/algebraic-effects-for-the-rest-of-us/]

import { perform, run_effect } from '.';

async function enumerate_files(dir: string) {
  let contents = await perform('open_directory', dir);
  await perform('log', `Enumering files in ${dir}`);

  for (const file of contents.files) {
    await perform('handle_file', file);
  }

  await perform('log', 'Done');
}

async function main() {
  await perform('log', 'Starting main');

  let dir: string = await perform('get_dir');
  // no need to specify the dependencies here
  enumerate_files(dir);

  // override some of the dependencies
  await run_effect(() => enumerate_files(dir), {
    async log(data: string) {
      console.log(`called in main: ${data}`);
    },
  });

  await perform('log', 'Ending main');
}

run_effect(main, {
  get_dir() {
    return 'my_dir';
  },
  open_directory(dir: string) {
    return { files: [dir] };
  },
  handle_file(file: string) {
    console.log(`HANDLING ${file}`);
  },
  log(data: any) {
    console.log(data);
  },
});
