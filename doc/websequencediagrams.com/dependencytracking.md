sequenceDiagram
title UI Initialization (Change Tracking)
autonumber
participant Fore
participant control
participant control

    Note over control: [All elements with 'ref'] -> group, repeat...
    Fore->>DependencyTracker: new()
    Note over Fore: initUI()
    Fore->>Fore: refresh(force=true)
    loop: all bound elements
        Note right of Fore: binding data and control
        Fore->>+control: refresh(force=true)
        control->>DependencyTracker: register(xpath)
        Note right of control: if control has bound widget
        control->>DependencyTracker: widget:register(xpath)
    end
        Fore->>Fore: dispatch 'refresh-done'
        Fore->>Fore: dispatch: 'ready'