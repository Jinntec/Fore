sequenceDiagram
title simple independen control change
autonumber


    User->>Control: change value
    Control->>setvalue: widget value
    setvalue->>DependencyTracker: notifyChange(xpath)
    DependencyTracker->>DependencyTracker: add to pending 
    setvalue->>Model: addChanged
    setvalue->>Model: recalculate
    setvalue->>Model: revalidate
    setvalue->>Fore: refresh tracked changes

    Note over DependencyTracker: iterate pending changes
    loop
        Fore->>Control: refresh()
    end
    Fore->>User: dispatch 'refresh-done'