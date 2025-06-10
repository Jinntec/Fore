# diagrams via kroki

> Creates diagrams from textual descriptions!

Kroki provides a single API to dozens of different charting packages such as plantUML, mermaid, graphviz etc.

For an overview of charting options:
https://kroki.io/examples.html

## Installation

There's a docker image to render chart of various types like
plantUML, mermaid, graphviz and more. It's available as a docker container.

Go and get Kroki and install as described here:
https://docs.kroki.io/kroki/setup/use-docker-or-podman/

start with:
`docker run -p8000:8000 yuzutech/kroki` to publish its port

## Client

There no client coming with Kroki. plantuml.html is an example in Fore serving that
purpose speaking to the `/plantuml` endpoint of Kroki. The example can be extended
to support more types.

* allows to edit the diagram text and post it to Kroki, get back the rendered svg and show it in the page
* via browser print a pdf of the diagram can be generated or the image can be saved locally as svg

