package com.rdoc.reader

import android.content.Context
import android.content.SharedPreferences
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject

/** Local-only recent + last-doc prefs (SharedPreferences). */
object RecentStore {
    const val PREFS = "rdoc_reader"
    const val KEY_RECENT = "recent"
    const val KEY_LAST_URI = "last_uri"
    const val KEY_LAST_TITLE = "last_title"
    const val MAX_RECENT = 12

    fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun remember(context: Context, uri: Uri, title: String) {
        val p = prefs(context)
        val uriStr = uri.toString()
        val arr = JSONArray(p.getString(KEY_RECENT, "[]"))
        val next = JSONArray()
        next.put(JSONObject().put("uri", uriStr).put("title", title))
        for (i in 0 until arr.length()) {
            val obj = arr.optJSONObject(i) ?: continue
            if (obj.optString("uri") == uriStr) continue
            next.put(obj)
            if (next.length() >= MAX_RECENT) break
        }
        p.edit()
            .putString(KEY_RECENT, next.toString())
            .putString(KEY_LAST_URI, uriStr)
            .putString(KEY_LAST_TITLE, title)
            .apply()
        LastDocWidgetProvider.updateAll(context)
    }

    fun load(context: Context): List<Pair<String, String>> {
        val arr = JSONArray(prefs(context).getString(KEY_RECENT, "[]"))
        val out = mutableListOf<Pair<String, String>>()
        for (i in 0 until arr.length()) {
            val obj = arr.optJSONObject(i) ?: continue
            val u = obj.optString("uri")
            val t = obj.optString("title", u)
            if (u.isNotEmpty()) out.add(t to u)
        }
        return out
    }

    fun clear(context: Context) {
        prefs(context).edit()
            .remove(KEY_RECENT)
            .remove(KEY_LAST_URI)
            .remove(KEY_LAST_TITLE)
            .apply()
        LastDocWidgetProvider.updateAll(context)
    }

    fun lastUri(context: Context): String? =
        prefs(context).getString(KEY_LAST_URI, null)?.takeIf { it.isNotEmpty() }

    fun lastTitle(context: Context): String? =
        prefs(context).getString(KEY_LAST_TITLE, null)?.takeIf { it.isNotEmpty() }
}
