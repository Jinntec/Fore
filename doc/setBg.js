// !!!! important to use a closure here - otherwise script will pollute global scope and net being re-entrant
{
  const div = document.querySelector('#rule');
  const bg = div.getAttribute('data-style');
  document.body.style.background = bg;
}
