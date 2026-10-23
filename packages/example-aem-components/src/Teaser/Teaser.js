// A component written against @adobe/aem-react-editable-components v1: model fields arrive as
// plain props and the edit config is the second MapTo() argument. The only change needed to
// run it in the Next.js app is the MapTo import (was "@adobe/aem-react-editable-components").
import React from "react";
import Link from "next/link";
import { MapTo } from "aem-react-spa-next/v1-compat";

import "./Teaser.css";

const TeaserEditConfig = {
  emptyLabel: "Teaser",
  isEmpty: (props) => !props || !props.title,
};

const Teaser = ({ title, description, linkURL, linkText }) => {
  if (TeaserEditConfig.isEmpty({ title })) {
    return null;
  }

  return (
    <div className="teaser">
      <h3 className="teaser__title">{title}</h3>
      {description && <p className="teaser__description">{description}</p>}
      {linkURL && (
        <Link className="teaser__link" href={linkURL}>
          {linkText || "Read more"}
        </Link>
      )}
    </div>
  );
};

export default MapTo("example/components/teaser")(Teaser, TeaserEditConfig);
