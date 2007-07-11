package nextapp.echo.webcontainer.service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import nextapp.echo.app.AwtImageReference;
import nextapp.echo.app.ImageReference;
import nextapp.echo.app.StreamImageReference;
import nextapp.echo.webcontainer.Connection;
import nextapp.echo.webcontainer.ContentType;
import nextapp.echo.webcontainer.Service;
import nextapp.echo.webcontainer.UserInstance;
import nextapp.echo.webcontainer.util.PngEncoder;

public class ImageService 
implements Service {

    /** <code>Service</code> identifier. */
    private static final String SERVICE_ID = "Echo.Image"; 
    
    /** Singleton instance of this <code>Service</code>. */
    public static final ImageService INSTANCE = new ImageService();
    
    private static final String PARAMETER_IMAGE_UID = "iid"; 

    private static final String[] URL_PARAMETERS = new String[]{PARAMETER_IMAGE_UID}; 
    
    private static final Map globalImages = new HashMap();
    
    public static final void addGlobalImage(String imageId, ImageReference imageReference) {
        globalImages.put(imageId, imageReference);
    }
    
    public static void install() { }
    
    /**
     * @see nextapp.echo.webcontainer.Service#getId()
     */
    public String getId() {
        return SERVICE_ID;
    }
    
    /**
     * @see nextapp.echo.webcontainer.Service#getVersion()
     */
    public int getVersion() {
        return 0; // Enable caching.
    }

    /**
     * Creates a URI to retrieve a specific image for a specific component 
     * from the server.
     * 
     * @param userInstance the relevant application user instance
     * @param imageId the unique id to retrieve the image from the
     *        <code>ContainerInstance</code>
     */
    public String createUri(UserInstance userInstance, String imageId) {
        return userInstance.getServiceUri(this, URL_PARAMETERS, new String[]{imageId});
    }

    /**
     * Renders the specified image to the given connection.
     * Implementations should set the response content type, and write image
     * data to the response <code>OutputStream</code>.
     * 
     * @param conn the <code>Connection</code> on which to render the image
     * @param imageReference the image to be rendered
     * @throws IOException if the image cannot be rendered
     */
    public void renderImage(Connection conn, ImageReference imageReference) 
    throws IOException {
        if (imageReference instanceof StreamImageReference) {
            renderStreamImage(conn, imageReference);
        } else if (imageReference instanceof AwtImageReference) {
            renderAwtImage(conn, imageReference);
        } else {
            throw new IOException("Unsupported image type: " + imageReference.getClass().getName());
        }
    }
    
    private void renderAwtImage(Connection conn, ImageReference imageReference) 
    throws IOException {
        try {
            PngEncoder encoder = new PngEncoder(((AwtImageReference) imageReference).getImage(), true, null, 3);
            conn.setContentType(ContentType.IMAGE_PNG);
            encoder.encode(conn.getOutputStream());
        } catch (IOException ex) {
            // Internet Explorer appears to enjoy making half-hearted requests for images, wherein it resets the connection
            // leaving us with an IOException.  This exception is silently eaten.
            // It would preferable to only ignore SocketExceptions, however the API documentation does not provide
            // enough information to suggest that such a strategy would be adequate.
        }
    }

    private void renderStreamImage(Connection conn, ImageReference imageReference)
    throws IOException {
        try {
            StreamImageReference streamImageReference = (StreamImageReference) imageReference;
            conn.setContentType(new ContentType(streamImageReference.getContentType(), true));
            streamImageReference.render(conn.getOutputStream());
        } catch (IOException ex) {
            // Internet Explorer appears to enjoy making half-hearted requests for images, wherein it resets the connection
            // leaving us with an IOException.  This exception is silently eaten.
            // It would preferable to only ignore SocketExceptions, however the API documentation does not provide
            // enough information to suggest that such a strategy would be adequate.
        }
    }
    
    /**
     * Gets the image with the specified id.
     * 
     * @param userInstance the <code>UserInstance</code> from which the image was requested
     * @param imageId the id of the image
     * @return the image if found, <code>null</code> otherwise.
     */
    public ImageReference getImage(UserInstance userInstance, String imageId) {
        ImageReference image = (ImageReference) globalImages.get(imageId);
        if (image == null) {
            image = (ImageReference) userInstance.getIdTable().getObject(imageId);
        }
        return image;
    }
    
    /**
     * @see nextapp.echo.webcontainer.Service#service(nextapp.echo.webcontainer.Connection)
     */
    public void service(Connection conn)
    throws IOException {
        UserInstance userInstance = (UserInstance) conn.getUserInstance();
        if (userInstance == null) {
            serviceBadRequest(conn, "No container available.");
            return;
        }
        String imageId = conn.getRequest().getParameter(PARAMETER_IMAGE_UID);
        if (imageId == null) {
            serviceBadRequest(conn, "Image UID not specified.");
            return;
        }
        
        ImageReference imageReference = getImage(userInstance, imageId);
        
        if (imageReference == null) {
            serviceBadRequest(conn, "Image UID is not valid.");
            return;
        }
        renderImage(conn, imageReference);
    }
    
    public void serviceBadRequest(Connection conn, String message) {
        conn.getResponse().setStatus(HttpServletResponse.SC_BAD_REQUEST);
        conn.setContentType(ContentType.TEXT_PLAIN);
        conn.getWriter().write(message);
    }
}
