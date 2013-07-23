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
import java.net.URISyntaxException;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 
 * @author Andrew Eisenberg
 * @created 2013-07-18
 */
@Controller
@RequestMapping("/sinspctr/configs")
public class SInspctrController {
    
    @RequestMapping(value = "/{path}", method = RequestMethod.GET)
    @ResponseStatus(HttpStatus.CREATED)
    @ResponseBody
    public ResponseEntity<String> findConfig(@PathVariable("path") String path) {
        ResponseEntity<String> response;
        try {
            File siConfigFile = getConfigFile(path);
            HttpHeaders headers = new HttpHeaders();
            headers.add("content-type", "application/xml");
            response = new ResponseEntity<String>(FileCopyUtils.copyToString(new FileReader(siConfigFile)), headers, HttpStatus.OK);
            return response;
        } catch (Exception e) {
            return new ResponseEntity<String>(HttpStatus.NOT_FOUND);
        }
    }

    private File getConfigFile(String path) throws URISyntaxException {
        return new File(SInspctrController.class.getClassLoader().getResource("META-INF/spring/integration/spring-integration-context.xml").toURI());
    }

} 
