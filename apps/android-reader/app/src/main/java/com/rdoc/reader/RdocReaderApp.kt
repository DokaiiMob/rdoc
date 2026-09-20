package com.rdoc.reader

import android.app.Application
import com.google.android.material.color.DynamicColors

class RdocReaderApp : Application() {
    override fun onCreate() {
        super.onCreate()
        DynamicColors.applyToActivitiesIfAvailable(this)
    }
}
