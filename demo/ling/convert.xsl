<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:strip-space elements="*"/>

    <xsl:template match="/">
        <xsl:apply-templates/>
    </xsl:template>

    <xsl:template match="head">
        <xsl:apply-templates/>
        <link href="styles.css" rel="stylesheet"/>
    </xsl:template>

    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="fx-select">
        <fx-control ref="{@ref}">
            <xsl:apply-templates/>
        </fx-control>
    </xsl:template>

    <xsl:template match="fx-select1">
        <fx-control ref="{@ref}">
            <xsl:apply-templates/>
        </fx-control>
    </xsl:template>

    <xsl:template match="fx-itemset">
        <select ref="{@nodeset}" class="widget">
            <template>
                <option><xsl:attribute name="value">{<xsl:value-of select="fx-label/@ref"/>}</xsl:attribute>{<xsl:value-of select="fx-value/@ref"/>}</option>
                <xsl:apply-templates/>
            </template>
        </select>
    </xsl:template>

    <xsl:template match="fx-repeat">
        <fx-repeat ref="{@ref}" id="{@id}">
            <template>
                <xsl:apply-templates/>
            </template>
        </fx-repeat>
    </xsl:template>
    <xsl:template match="fx-item">
        <option value="{fx-value}"><xsl:value-of select="fx-label"/></option>
    </xsl:template>

    <xsl:template match="fx-trigger[fx-label/@class='input-group-addon']">
        <fx-trigger>
            <button>add</button>
            <xsl:apply-templates/>
        </fx-trigger>
    </xsl:template>

    <xsl:template match="fx-label"></xsl:template>
    <xsl:template match="fx-value"></xsl:template>

</xsl:stylesheet>