// !!!! important to use a closure here - otherwise script will pollute global scope and not being re-entrant
{
  const inst = document.querySelector('fx-instance');
  console.log('instanceData', inst.instanceData.querySelector('confirmation').textContent);
  alert(`confirmation: ${inst.instanceData.querySelector('confirmation').textContent}`);
}
