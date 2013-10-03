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

import javax.servlet.http.HttpServletRequest;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * 
 * @author Andrew Eisenberg
 * @created 2013-07-18
 */
@Controller
@RequestMapping("/sinspctr/configs")
public class SInspctrController {
    
    @ResponseBody
    @RequestMapping(value = "/**/*.xml", method = RequestMethod.GET)
    public ResponseEntity<String> findConfig(HttpServletRequest request) {
        ResponseEntity<String> response;
        try {
            String servletPath = request.getServletPath();
            if (servletPath.startsWith("/sinspctr/configs")) {
                servletPath = servletPath.substring("/sinspctr/configs".length(), servletPath.length());
            }
            File siConfigFile = ResourceLocator.getClasspathRelativeFile(servletPath);
            HttpHeaders headers = new HttpHeaders();
            headers.add("content-type", "application/xml");
            response = new ResponseEntity<String>(FileCopyUtils.copyToString(new FileReader(siConfigFile)), headers, HttpStatus.OK);
            return response;
        } catch (Exception e) {
            return new ResponseEntity<String>(HttpStatus.NOT_FOUND);
        }
    }

    @ResponseBody
    @RequestMapping(value = "/**/*.xml", method = RequestMethod.POST)
    public ResponseEntity<String> saveConfig(HttpServletRequest request, @RequestParam("xml") String xml) {
        ResponseEntity<String> response;
        HttpHeaders headers = new HttpHeaders();
        headers.add("content-type", "application/json");
        try {
            //"META-INF/spring/integration/spring-integration-context.xml"
            String servletPath = request.getServletPath();
            if (servletPath.startsWith("/sinspctr/configs")) {
                servletPath = servletPath.substring("/sinspctr/configs".length(), servletPath.length());
            }
            File siConfigFile = ResourceLocator.getClasspathRelativeFile(servletPath);
            FileCopyUtils.copy(siConfigFile, createBackupFile(siConfigFile));
            siConfigFile.delete();
            FileCopyUtils.copy(xml.getBytes(), siConfigFile);
            response = new ResponseEntity<String>("{\"status\":\"success\"}", HttpStatus.OK);
            return response;
        } catch (Exception e) {
            return new ResponseEntity<String>("{\"error\":\"" + e.getMessage() + "\"}", headers, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private File createBackupFile(File siConfigFile) {
        File newFile = new File(siConfigFile.getParent(), siConfigFile.getName() + ".BAK");
        int cnt = 0;
        while (newFile.exists() && cnt < 1000) {
            cnt++;
            newFile = new File(siConfigFile.getParent(), siConfigFile.getName() + ".BAK" + cnt);
        }
        return newFile;
    }
    
    @RequestMapping(value = "/", method = RequestMethod.GET, produces="application/json")
    @ResponseBody
    public ResponseEntity<String[]> getAllConfigs() {
        try {
            String[] results = ResourceLocator.findResourcesPaths("**/*.xml");
            // TODO convert to HATEOAS response
            return new ResponseEntity<String[]>(results, HttpStatus.OK);
        } catch (IOException e) {
            return new ResponseEntity<String[]>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
} 
