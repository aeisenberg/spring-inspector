/*
 * Copyright 2013 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.springsource.sinspctr;

import java.io.IOException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.web.context.support.XmlWebApplicationContext;

/**
 * The main driver class for the admin.
 * 
 * @author Mark Pollack
 * @author Jennifer Hickey
 * @author Ilayaperumal Gopinathan
 * @author Mark Fisher
 * @author Eric Bottard
 * @author David Turanski
 */
public class AdminMain {

    private static final int DEFAULT_PORT = 8081;

    private static final Log logger = LogFactory.getLog(AdminMain.class);
	
	/**
     * Base location for XD config files. Chosen so as not to collide with user provided content.
     */
    public static final String CONFIG_ROOT = "META-INF/spring/sinspctr/";

    public static void main(String[] args) {
        try {
            launchStreamServer();
        } catch (IOException e) {
            logger.error("Something's messed up", e);
        }
    }

    /**
	 * Launch stream server with the given home and transport
     * @throws IOException 
	 */
	static InspctrServer launchStreamServer() throws IOException {
		XmlWebApplicationContext context = new XmlWebApplicationContext();
		context.setConfigLocation("classpath:" + CONFIG_ROOT + "sinspctr-server.xml");

		// Not making StreamServer a spring bean eases move to .war file if
		// needed
		final InspctrServer server = new InspctrServer(context, DEFAULT_PORT);
		server.afterPropertiesSet();
		server.start();
		StringBuilder runtimeInfo = new StringBuilder(String.format("Running in Local Mode on port: %s ",
				server.getPort()));
		System.out.println(BannerUtils.displayBanner(null, runtimeInfo.toString()));
		context.addApplicationListener(new ApplicationListener<ContextClosedEvent>() {
			@Override
			public void onApplicationEvent(ContextClosedEvent event) {
				server.stop();
			}
		});
		context.registerShutdownHook();
		return server;
	}
}
