<map version="freeplane 1.11.5">
    <!--To view this file, download free mind mapping software Freeplane from https://www.freeplane.org -->
    <node TEXT="new" FOLDED="false" ID="ID_696401721" CREATED="1610381621824" MODIFIED="1700589337104" STYLE="oval">
        <font SIZE="18"/>
        <hook NAME="MapStyle" zoom="1.1703821">
            <properties
                    edgeColorConfiguration="#808080ff,#ff0000ff,#0000ffff,#00ff00ff,#ff00ffff,#00ffffff,#7c0000ff,#00007cff,#007c00ff,#7c007cff,#007c7cff,#7c7c00ff"
                    show_icon_for_attributes="true" associatedTemplateLocation="template:/standard-1.6.mm"
                    show_note_icons="true" fit_to_viewport="false"/>

            <map_styles>
                <stylenode LOCALIZED_TEXT="styles.root_node" STYLE="oval" UNIFORM_SHAPE="true" VGAP_QUANTITY="24 pt">
                    <font SIZE="24"/>
                    <stylenode LOCALIZED_TEXT="styles.predefined" POSITION="bottom_or_right" STYLE="bubble">
                        <stylenode LOCALIZED_TEXT="default" ID="ID_271890427" ICON_SIZE="12 pt" COLOR="#000000"
                                   STYLE="fork">
                            <arrowlink SHAPE="CUBIC_CURVE" COLOR="#000000" WIDTH="2" TRANSPARENCY="200" DASH=""
                                       FONT_SIZE="9" FONT_FAMILY="SansSerif" DESTINATION="ID_271890427"
                                       STARTARROW="NONE" ENDARROW="DEFAULT"/>
                            <font NAME="SansSerif" SIZE="10" BOLD="false" ITALIC="false"/>
                            <richcontent TYPE="DETAILS" CONTENT-TYPE="plain/auto"/>
                            <richcontent TYPE="NOTE" CONTENT-TYPE="plain/auto"/>
                        </stylenode>
                        <stylenode LOCALIZED_TEXT="defaultstyle.details"/>
                        <stylenode LOCALIZED_TEXT="defaultstyle.attributes">
                            <font SIZE="9"/>
                        </stylenode>
                        <stylenode LOCALIZED_TEXT="defaultstyle.note" COLOR="#000000" BACKGROUND_COLOR="#ffffff"
                                   TEXT_ALIGN="LEFT"/>
                        <stylenode LOCALIZED_TEXT="defaultstyle.floating">
                            <edge STYLE="hide_edge"/>
                            <cloud COLOR="#f0f0f0" SHAPE="ROUND_RECT"/>
                        </stylenode>
                        <stylenode LOCALIZED_TEXT="defaultstyle.selection" BACKGROUND_COLOR="#afd3f7"
                                   BORDER_COLOR_LIKE_EDGE="false" BORDER_COLOR="#afd3f7"/>
                    </stylenode>
                    <stylenode LOCALIZED_TEXT="styles.user-defined" POSITION="bottom_or_right" STYLE="bubble">
                        <stylenode LOCALIZED_TEXT="styles.topic" COLOR="#18898b" STYLE="fork">
                            <font NAME="Liberation Sans" SIZE="10" BOLD="true"/>
                        </stylenode>
                        <stylenode LOCALIZED_TEXT="styles.subtopic" COLOR="#cc3300" STYLE="fork">
                            <font NAME="Liberation Sans" SIZE="10" BOLD="true"/>
                        </stylenode>
                        <stylenode LOCALIZED_TEXT="styles.subsubtopic" COLOR="#669900">
                            <font NAME="Liberation Sans" SIZE="10" BOLD="true"/>
                        </stylenode>
                        <stylenode LOCALIZED_TEXT="styles.important" ID="ID_67550811">
                            <icon BUILTIN="yes"/>
                            <arrowlink COLOR="#003399" TRANSPARENCY="255" DESTINATION="ID_67550811"/>
                        </stylenode>
                        <stylenode LOCALIZED_TEXT="styles.flower" COLOR="#ffffff" BACKGROUND_COLOR="#255aba"
                                   STYLE="oval" TEXT_ALIGN="CENTER" BORDER_WIDTH_LIKE_EDGE="false" BORDER_WIDTH="22 pt"
                                   BORDER_COLOR_LIKE_EDGE="false" BORDER_COLOR="#f9d71c" BORDER_DASH_LIKE_EDGE="false"
                                   BORDER_DASH="CLOSE_DOTS" MAX_WIDTH="6 cm" MIN_WIDTH="3 cm"/>
                    </stylenode>
                    <stylenode LOCALIZED_TEXT="styles.AutomaticLayout" POSITION="bottom_or_right" STYLE="bubble">
                        <stylenode LOCALIZED_TEXT="AutomaticLayout.level.root" COLOR="#000000" STYLE="oval"
                                   SHAPE_HORIZONTAL_MARGIN="10 pt" SHAPE_VERTICAL_MARGIN="10 pt">
                            <font SIZE="18"/>
                        </stylenode>
                        <stylenode LOCALIZED_TEXT="AutomaticLayout.level,1" COLOR="#0033ff">
                            <font SIZE="16"/>
                        </stylenode>
                        <stylenode LOCALIZED_TEXT="AutomaticLayout.level,2" COLOR="#00b439">
                            <font SIZE="14"/>
                        </stylenode>
                        <stylenode LOCALIZED_TEXT="AutomaticLayout.level,3" COLOR="#990000">
                            <font SIZE="12"/>
                        </stylenode>
                        <stylenode LOCALIZED_TEXT="AutomaticLayout.level,4" COLOR="#111111">
                            <font SIZE="10"/>
                        </stylenode>
                        <stylenode LOCALIZED_TEXT="AutomaticLayout.level,5"/>
                        <stylenode LOCALIZED_TEXT="AutomaticLayout.level,6"/>
                        <stylenode LOCALIZED_TEXT="AutomaticLayout.level,7"/>
                        <stylenode LOCALIZED_TEXT="AutomaticLayout.level,8"/>
                        <stylenode LOCALIZED_TEXT="AutomaticLayout.level,9"/>
                        <stylenode LOCALIZED_TEXT="AutomaticLayout.level,10"/>
                        <stylenode LOCALIZED_TEXT="AutomaticLayout.level,11"/>
                    </stylenode>
                </stylenode>
            </map_styles>
        </hook>
        <hook NAME="AutomaticEdgeColor" COUNTER="1" RULE="ON_BRANCH_CREATION"/>
        <node TEXT="foo" POSITION="bottom_or_right" ID="ID_1073418878" CREATED="1700589337149" MODIFIED="1700589341291">
            <edge COLOR="#ff0000"/>
            <node TEXT="bar" ID="ID_1341706381" CREATED="1700589341312" MODIFIED="1700589345566"/>
        </node>
    </node>
</map>
