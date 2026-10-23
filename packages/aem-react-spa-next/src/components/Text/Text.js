/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { EditableComponent, MapTo } from "@adobe/aem-react-editable-components";
import React from "react";
import sanitizeHtml from "sanitize-html";
import extractModelId from "../../utils/extract-model-id";
import sanitizeOptions from "../sanitize-html.whitelist";

import "./Text.css";

/**
 * Default Edit configuration for the Text component that interact with the Core Text component and sub-types
 *
 * @type EditConfig
 */
const TextEditConfig = {
  emptyLabel: "Text",

  isEmpty: function (props) {
    return !props || !props.text || props.text.trim().length < 1;
  },
};

const Text = (props) => {
  // DOMPurify needs a DOM and returns nothing useful on the server, which made the SSR
  // markup differ from the client. sanitize-html is pure JS, so both sides emit the same HTML.
  const richTextContent = () => {
    return (
        <div
            id={extractModelId(props.cqPath)}
            data-rte-editelement
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(props.text, sanitizeOptions),
            }}
        />
    );
  };

  const textContent = () => {
    return <div>{props.text}</div>;
  };

  return props.richText ? richTextContent() : textContent();
};

const EditableText = (props) => {
  return (
      <EditableComponent config={TextEditConfig} {...props}>
        <Text {...props} />
      </EditableComponent>
  );
};

export default MapTo("aem-react-spa/components/text")(EditableText);
