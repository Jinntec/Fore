sequenceDiagram

title: recalculate()
autonumber
participant Model
participant DependencyTracker

    participant Binding

    
        Note over Model: recalculate phase - first run
        
        
        activate Model
            Model->>DependencyTracker: dependencyGraph
            loop: dependencyGraph.overallOrder()
                Model->>Binding: update()
            end
        deactivate Model
        


        Note over Model: recalculate with changes
        activate Model
            Model->>DependencyTracker: buildSubgraphForChanges

            loop: pendingUpdates
                DependencyTracker->>DependencyTracker: add to subgraph

                loop: dependencies
                    DependencyTracker->>DependencyTracker: add to subgraph
                end
            end

            DependencyTracker->>Model: ordered list of changes

            loop: list
                Model->>Binding: update()
            end
        deactivate Model

    
    




