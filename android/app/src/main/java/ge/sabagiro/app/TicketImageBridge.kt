package ge.sabagiro.app

import android.app.Activity
import android.content.ContentValues
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.webkit.JavascriptInterface
import android.widget.Toast

/**
 * JS → Gallery: `SabagiroApp.saveImageToGallery(base64Png, filename)`
 */
class TicketImageBridge(private val activity: Activity) {
    @JavascriptInterface
    fun saveImageToGallery(base64: String?, filename: String?): Boolean {
        if (base64.isNullOrBlank()) return false
        return try {
            val clean = base64.substringAfter("base64,", base64)
            val bytes = Base64.decode(clean, Base64.DEFAULT)
            val name = filename?.takeIf { it.isNotBlank() } ?: "sabagiro-ticket.png"

            val values = ContentValues().apply {
                put(MediaStore.Images.Media.DISPLAY_NAME, name)
                put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(
                        MediaStore.Images.Media.RELATIVE_PATH,
                        Environment.DIRECTORY_PICTURES + "/Sabagiro",
                    )
                    put(MediaStore.Images.Media.IS_PENDING, 1)
                }
            }

            val resolver = activity.contentResolver
            val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                ?: return false

            resolver.openOutputStream(uri)?.use { out -> out.write(bytes) }
                ?: return false

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.clear()
                values.put(MediaStore.Images.Media.IS_PENDING, 0)
                resolver.update(uri, values, null, null)
            }

            activity.runOnUiThread {
                Toast.makeText(activity, "Ticket saved to Photos", Toast.LENGTH_SHORT).show()
            }
            true
        } catch (_: Exception) {
            activity.runOnUiThread {
                Toast.makeText(activity, "Could not save ticket", Toast.LENGTH_SHORT).show()
            }
            false
        }
    }
}
