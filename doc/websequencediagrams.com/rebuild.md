sequenceDiagram
title:Dependency Tracking
autonumber
participant Model
participant FxBind
participant DependencyTracker
participant NodeBinding
participant FacetBinding


    activate Model
    
        Note over Model: rebuild phase
        Model->>Model: rebuild()
        loop: fx-bind 
        activate FxBind
        Model->>FxBind: init()

        FxBind->>NodeBinding:create NodeBinding for ref
        activate NodeBinding
        NodeBinding->>NodeBinding:constructor
        NodeBinding->>DependencyTracker:register(xpath:node,NodeBinding)
        deactivate NodeBinding

        loop: facets
            FxBind->>FacetBinding:create FacetBinding for facet
            activate FacetBinding

                FacetBinding->>DependencyTracker:register(FacetBinding)
            
            deactivate FacetBinding

            
        end
        
        loop: forEach dependency in facet xpath
            FxBind->>NodeBinding:create NodeBinding for dep
            activate NodeBinding
                NodeBinding->>DependencyTracker: register(xpath,NodeBinding)
            deactivate NodeBinding
        end
        deactivate FxBind
            
    end
    
    
    deactivate Model