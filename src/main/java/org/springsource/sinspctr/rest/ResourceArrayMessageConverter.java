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

import java.io.IOException;
import java.io.OutputStream;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.converter.AbstractHttpMessageConverter;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.stereotype.Component;

/**
 * 
 * @author Andrew Eisenberg
 * @created 2013-07-26
 */
@Component
public class ResourceArrayMessageConverter extends
        AbstractHttpMessageConverter<Resource[]> {

    @Override
    protected boolean supports(Class<?> clazz) {
        return Resource[].class.isAssignableFrom(clazz);
    }

    @Override
    protected Resource[] readInternal(Class<? extends Resource[]> clazz,
            HttpInputMessage inputMessage) throws IOException,
            HttpMessageNotReadableException {
        throw new RuntimeException("Not supported");
    }

    @Override
    protected void writeInternal(Resource[] resources, HttpOutputMessage outputMessage)
            throws IOException, HttpMessageNotWritableException {
        
        OutputStream body = outputMessage.getBody();
        body.write("[".getBytes());
        for (int i = 0; i < resources.length; i++) {
            Resource resource = resources[i];
            body.write("\"".getBytes());
            body.write(resource.getFile().getAbsoluteFile().getPath().getBytes());
            body.write("\"".getBytes());
            if (i < resources.length-1) {
                body.write(",".getBytes());
            }
        }
    }

}
