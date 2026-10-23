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

import { ModelManager } from '@adobe/aem-spa-page-model-manager';
import ProxyModelClient from './ProxyModelClient';

let seededPagePath = null;

/**
 * Seeds the browser's ModelManager singleton with the page model that was rendered on the
 * server, so it never re-fetches what is already in the HTML.
 *
 * This has to happen during render rather than in an effect: EditableComponent registers
 * `ModelManager.addListener()` in its own effect, and child effects run before parent
 * effects, so an effect here would be too late (addListener throws when the
 * ModelManager has not been initialised). It is a no-op on the server, where the
 * singleton would otherwise be shared between requests, and idempotent per page path.
 *
 * @param {string} pagePath
 * @param {object} pageModel - raw page model as fetched on the server
 * @param {{ proxyPrefix?: string, apiHost?: string }} [options]
 */
export function seedModelManager(pagePath, pageModel, options = {}) {
    if (typeof window === 'undefined' || seededPagePath === pagePath) {
        return;
    }
    seededPagePath = pagePath;

    ModelManager.initializeAsync({
        path: pagePath,
        model: pageModel,
        modelClient: new ProxyModelClient(options.proxyPrefix, options.apiHost),
    });
}
