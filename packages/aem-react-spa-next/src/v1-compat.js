/*
 * Part of aem-react-spa-next, a derivative of adobe/aem-react-spa; see NOTICE.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { EditableComponent, MapTo as mapToV2 } from '@adobe/aem-react-editable-components';
import React from 'react';

/**
 * Drop-in replacement for the v1 `MapTo` of @adobe/aem-react-editable-components, for
 * components written against v1:
 *
 *     MapTo('mysite/components/teaser')(Teaser, TeaserEditConfig);
 *
 * v1 wrapped the component in a ModelProvider (which loads the model in componentDidMount,
 * i.e. only in the browser) and passed model fields as plain props. v2's MapTo ignores the
 * edit config and hands children a single `model` prop. This adapter gives v1 components
 * what they expect, synchronously, so they render on the server too:
 *
 * - EditableComponent receives the `model` from the parent Container and spreads its fields
 *   (`text`, `src`, ...) onto the component, alongside cqPath / isInEditor.
 * - The v1 edit config (emptyLabel, isEmpty) drives the editor placeholder as before.
 *
 * Only switch the MapTo import; the component itself does not change. Components already
 * written for v2 (wrapping themselves in EditableComponent) keep using Adobe's MapTo.
 *
 * @param {string|string[]} resourceTypes
 * @returns {(Component: React.ComponentType, editConfig?: object) => React.ComponentType}
 */
export const MapTo = (resourceTypes) => (Component, editConfig) => {
    const Mapped = (props) => (
        <EditableComponent config={editConfig} {...props}>
            <Component {...props} />
        </EditableComponent>
    );
    Mapped.displayName = `MapTo(${Component.displayName || Component.name || 'Component'})`;

    mapToV2(resourceTypes)(Mapped);

    return Mapped;
};
