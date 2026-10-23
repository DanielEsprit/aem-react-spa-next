// A component written against @adobe/aem-react-editable-components v2: it wraps itself in
// EditableComponent (which spreads the model fields onto the child) and uses Adobe's MapTo.
// v2-style components need no changes to run in the Next.js app.
import React from "react";
import { EditableComponent, MapTo } from "@adobe/aem-react-editable-components";

const QuoteEditConfig = {
  emptyLabel: "Quote",
  isEmpty: (props) => !props || !props.quote,
};

const Quote = ({ quote, author }) => (
  <figure className="quote">
    <blockquote>{quote}</blockquote>
    {author && <figcaption>{author}</figcaption>}
  </figure>
);

const EditableQuote = (props) => (
  <EditableComponent config={QuoteEditConfig} {...props}>
    <Quote {...props} />
  </EditableComponent>
);

export default MapTo("example/components/quote")(EditableQuote);
