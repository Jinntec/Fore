function toggleVisibilityUI(){
    const adi = document.getElementById('adi-wrapper');
    const visiblebtn = document.getElementById('visiblebtn');
    const invisiblebtn = document.getElementById('invisiblebtn');
    if(adi.style.display === 'none'){
        invisiblebtn.style.display = 'none';
        visiblebtn.style.display = 'inline';
    }else{
        invisiblebtn.style.display = 'none';
        visiblebtn.style.display = 'inline';
    }
    window.ADI.toggle()
}

toggleVisibilityUI();

