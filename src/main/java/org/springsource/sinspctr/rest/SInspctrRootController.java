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

import javax.servlet.http.HttpServletRequest;

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
 * Always retrieves the index.html
 * @author Andrew Eisenberg
 * @created 2013-07-27
 */
@Controller
@RequestMapping("/sinspctr/edit")
public class SInspctrRootController {
    
    @ResponseBody
    @RequestMapping(value = {"/**/*.xml", "", "/"}, method = RequestMethod.GET)
    public ResponseEntity<String> getRoot(HttpServletRequest request) {
        return getIndexHtml();
    }
    
    private ResponseEntity<String> getIndexHtml() {
        ResponseEntity<String> response;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.add("content-type", "text/html");
            response = new ResponseEntity<String>(FileCopyUtils.copyToString(
                    new FileReader(ResourceLocator.getClasspathRelativeFile("assets/index.html"))), 
                    headers, HttpStatus.OK);
            return response;
        } catch (Exception e) {
            return new ResponseEntity<String>(HttpStatus.NOT_FOUND);
        }
    }
} 
