package com.rdoc.reader

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.widget.RemoteViews

/** Minimal home-screen widget: open the last document (or launch the app). */
class LastDocWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id)
        }
    }

    companion object {
        fun updateAll(context: Context) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(
                ComponentName(context, LastDocWidgetProvider::class.java)
            )
            if (ids.isEmpty()) return
            for (id in ids) {
                updateAppWidget(context, mgr, id)
            }
        }

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val lastUri = RecentStore.lastUri(context)
            val lastTitle = RecentStore.lastTitle(context)
            val views = RemoteViews(context.packageName, R.layout.widget_last_doc)

            if (lastUri != null) {
                views.setTextViewText(R.id.widget_title, lastTitle ?: "Last document")
                views.setTextViewText(
                    R.id.widget_subtitle,
                    context.getString(R.string.widget_tap_open)
                )
            } else {
                views.setTextViewText(R.id.widget_title, context.getString(R.string.widget_no_doc))
                views.setTextViewText(
                    R.id.widget_subtitle,
                    context.getString(R.string.widget_open_app)
                )
            }

            val launch = if (lastUri != null) {
                Intent(context, MainActivity::class.java).apply {
                    action = Intent.ACTION_VIEW
                    data = Uri.parse(lastUri)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                }
            } else {
                Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
            }

            val flags = PendingIntent.FLAG_UPDATE_CURRENT or
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PendingIntent.FLAG_IMMUTABLE
                } else {
                    0
                }
            views.setOnClickPendingIntent(
                R.id.widget_root,
                PendingIntent.getActivity(context, appWidgetId, launch, flags)
            )
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
