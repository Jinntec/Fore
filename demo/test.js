// !!!! important to use a closure here - otherwise script will pollute global scope and net being re-entrant
{
const inst = document.querySelector('fx-instance');
console.log('instanceData', inst.instanceData.firstElementChild);
alert(`confirmation: ${inst.instanceData.firstElementChild.firstElementChild.textContent}`);
}