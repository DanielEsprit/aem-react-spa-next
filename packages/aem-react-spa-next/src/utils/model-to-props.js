/*
 * Copyright 2022 Adobe. All rights reserved.
 * Modified for Next.js server rendering and hydration (aem-react-spa-next); see NOTICE.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Same transformation as the (non-exported) Utils.modelToProps of
 * @adobe/aem-react-editable-components: `:items` -> `cqItems`, `:itemsOrder` -> `cqItemsOrder`, ...
 *
 * @param {object} model - raw AEM model
 * @returns {object} component props
 */
export default function modelToProps(model) {
  if (!model || !Object.keys(model).length) {
    return { cqPath: '' };
  }

  const props = {};
  Object.getOwnPropertyNames(model).forEach((key) => {
    const propKey = key.startsWith(':')
      ? 'cq' + key.substring(1, 2).toUpperCase() + key.substring(2)
      : key;
    props[propKey] = model[key] || '';
  });

  return props;
}
