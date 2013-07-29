/*
 * Copyright 2011 SpringSource, a division of VMware, Inc
 * 
 * andrew - Initial API and implementation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.springsource.sinspctr.rest;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

/**
 * Some methods to handle looking for resources and paths
 * @author Andrew Eisenberg
 * @created 2013-07-29
 */
public class ResourceLocator {
    public static File getClasspathRelativeFile(String path) throws URISyntaxException {
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        return new File(findClassLoader().getResource(path).toURI());
    }

    public static String[] findResourcesPaths(String locationPattern) throws IOException {
        ClassLoader loader = findClassLoader();
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver(loader);
        Resource[] resources = resolver.getResources(locationPattern);
        // use project-relative path if appropriate
        String rootPath = resolver.getResource(".").getFile().getPath();
        String[] results = new String[resources.length];
        for (int i = 0; i < resources.length; i++) {
            String path = resources[i].getFile().getPath();
            if (path.startsWith(rootPath)) {
                path = path.substring(rootPath.length(), path.length());
            }
            results[i] = path;
        }
        return results;
    }

    public static ClassLoader findClassLoader() {
        ClassLoader loader = Thread.currentThread().getContextClassLoader();
        if (loader == null) {
            loader = SInspctrController.class.getClassLoader();
        }
        return loader;
    }
}
