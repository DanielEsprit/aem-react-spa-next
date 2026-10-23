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

'use client';

import { EditableComponent, Page } from '@adobe/aem-react-editable-components';
import React, { useMemo } from 'react';
import { seedModelManager } from './model-manager';
import modelToProps from './utils/model-to-props';
import './components/import-components';

/**
 * Next.js replacement for index.js + App.js.
 *
 * Renders an AEM page from a page model that was fetched on the server. Because the model
 * and `isInEditor` both arrive as props, the server render and the first client render
 * produce identical markup, so React can hydrate instead of re-rendering.
 *
 * @param {object} props
 * @param {object} props.pageModel   - raw AEM page model (the `.model.json` response)
 * @param {string} props.pagePath    - AEM page path, e.g. /content/mysite/us/en/home
 * @param {boolean} props.isInEditor - resolved on the server from `?wcmmode=`
 * @param {string} [props.proxyPrefix] - same-origin proxy used by the ModelManager for model updates
 * @param {string} [props.apiHost]   - AEM host, needed by the remote SPA editor to load its clientlibs
 */
const AemPage = ({ pageModel, pagePath, isInEditor = false, proxyPrefix, apiHost }) => {
    seedModelManager(pagePath, pageModel, { proxyPrefix, apiHost });

    // Memoised so EditableComponent's `model` effect does not see a new object every render.
    // Child pages are dropped: CRA rendered the whole site tree and let react-router pick
    // the active page, whereas in Next.js every page is its own route.
    const model = useMemo(() => {
        const { cqChildren, ...props } = modelToProps(pageModel);
        return props;
    }, [pageModel]);

    return (
        <EditableComponent model={model} cqPath={model.cqPath} isInEditor={isInEditor}>
            <Page {...model} isInEditor={isInEditor} className="page" />
        </EditableComponent>
    );
};

export default AemPage;
