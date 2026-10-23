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

import {ModelClient} from '@adobe/aem-spa-page-model-manager';

/**
 * Replaces LocalDevModelClient. Instead of sending the AEM Authorization header from the
 * browser (CRA inlined REACT_APP_AEM_AUTHORIZATION_HEADER into the bundle), model requests
 * go through a same-origin Next.js route handler that adds credentials on the server.
 */
export default class ProxyModelClient extends ModelClient {

    constructor(proxyPrefix = '/api/aem', apiHost) {
        super(apiHost);
        this._proxyPrefix = proxyPrefix;
    }

    fetch(modelPath) {

        if (!modelPath) {
            const err = `Fetching model rejected for path: ${modelPath}`;

            return Promise.reject(new Error(err));
        }

        return fetch(`${this._proxyPrefix}${modelPath}`, {
            credentials: 'same-origin'
        }).then((response) => {
            if ((response.status >= 200) && (response.status < 300)) {
                return response.json();
            }

            return Promise.reject(response);
        });
    }

}
