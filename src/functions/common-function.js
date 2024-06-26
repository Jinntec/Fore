export function prettifyXml(source) {
  const xmlDoc = new DOMParser().parseFromString(source, 'application/xml');
  const xsltDoc = new DOMParser().parseFromString(
    [
      // describes how we want to modify the XML - indent everything
      '<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:output method="xml" indent="yes" omit-xml-declaration="yes"/>',
      '  <xsl:strip-space elements="*"/>',
      '  <xsl:template match="text()">', // change to just text() to strip space in text nodes
      '    <xsl:value-of select="normalize-space(.)"/>',
      '  </xsl:template>',
      '  <xsl:template match="node()|@*">',
      '    <xsl:copy>',
      '        <xsl:apply-templates select="node()|@*"/>',
      '    </xsl:copy>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n'),
    'application/xml',
  );

  const xsltProcessor = new XSLTProcessor();
  xsltProcessor.importStylesheet(xsltDoc);
  const resultDoc = xsltProcessor.transformToDocument(xmlDoc);
  const resultXml = new XMLSerializer().serializeToString(resultDoc);
  return resultXml;
}
