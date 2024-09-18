// !!!! important to use a closure here - otherwise script will pollute global scope and net being re-entrant
{
  const allOpenDetails = document.querySelectorAll('details[open]');
  Array.from(allOpenDetails).forEach((details) => {
    details.removeAttribute('open');
  });
}
