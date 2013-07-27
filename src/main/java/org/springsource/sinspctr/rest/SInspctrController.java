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
import java.io.FileReader;
import java.io.IOException;
import java.net.URISyntaxException;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * 
 * @author Andrew Eisenberg
 * @created 2013-07-18
 */
@Controller
@RequestMapping("/sinspctr/configs")
public class SInspctrController {
    
    @RequestMapping(value = "/**/*.xml", method = RequestMethod.GET)
    // these don't work
//    @RequestMapping(value = "{path:.*}", method = RequestMethod.GET)
//    @RequestMapping(value = "{path:/**/*.xml}", method = RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<String> findConfig(/*@PathVariable("path") String path*/) {
        ResponseEntity<String> response;
        try {
            File siConfigFile = getConfigFile("META-INF/spring/integration/spring-integration-context.xml");
            HttpHeaders headers = new HttpHeaders();
            headers.add("content-type", "application/xml");
            response = new ResponseEntity<String>(FileCopyUtils.copyToString(new FileReader(siConfigFile)), headers, HttpStatus.OK);
            return response;
        } catch (Exception e) {
            return new ResponseEntity<String>(HttpStatus.NOT_FOUND);
        }
    }

    private File getConfigFile(String path) throws URISyntaxException {
        return new File(findClassLoader().getResource(path).toURI());
    }
    
    @RequestMapping(value = "/", method = RequestMethod.GET, produces="application/json")
    @ResponseBody
    public ResponseEntity<String[]> getAllConfigs() {
        ClassLoader loader = findClassLoader();
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver(loader);
        try {
            // Is there a way to go from Resource to JSON directly?
            Resource[] resources = resolver.getResources("**/*.xml");
            String rootPath = resolver.getResource(".").getFile().getPath();
            String[] results = new String[resources.length];
            for (int i = 0; i < resources.length; i++) {
                String path = resources[i].getFile().getPath();
                if (path.startsWith(rootPath)) {
                    path = path.substring(rootPath.length(), path.length());
                }
                results[i] = path;
            }
            return new ResponseEntity<String[]>(results, HttpStatus.OK);
        } catch (IOException e) {
            return new ResponseEntity<String[]>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @return
     */
    private ClassLoader findClassLoader() {
        ClassLoader loader = Thread.currentThread().getContextClassLoader();
        if (loader == null) {
            loader = SInspctrController.class.getClassLoader();
        }
        return loader;
    }


} 
