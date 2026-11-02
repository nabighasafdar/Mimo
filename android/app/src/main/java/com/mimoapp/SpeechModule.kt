package com.mimoapp

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

// Thin wrapper over Android's SpeechRecognizer. Emits onSpeechStart, onSpeechPartial,
// onSpeechResult and onSpeechError ({value: string}) as device events.
class SpeechModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  private val main = Handler(Looper.getMainLooper())
  private var recognizer: SpeechRecognizer? = null

  override fun getName() = "BonnieSpeech"

  private fun emit(event: String, value: String) {
    val map = Arguments.createMap()
    map.putString("value", value)
    reactContext.emitDeviceEvent(event, map)
  }

  private fun firstResult(bundle: Bundle?): String =
      bundle?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: ""

  private fun destroyRecognizer() {
    recognizer?.destroy()
    recognizer = null
  }

  @ReactMethod
  fun isAvailable(promise: Promise) {
    promise.resolve(SpeechRecognizer.isRecognitionAvailable(reactContext))
  }

  @ReactMethod
  fun start(locale: String) {
    main.post {
      destroyRecognizer()
      if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
        emit("onSpeechError", "unavailable")
        return@post
      }
      val r = SpeechRecognizer.createSpeechRecognizer(reactContext)
      r.setRecognitionListener(
          object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) = emit("onSpeechStart", "")
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onError(error: Int) = emit("onSpeechError", error.toString())
            override fun onResults(results: Bundle?) = emit("onSpeechResult", firstResult(results))
            override fun onPartialResults(partialResults: Bundle?) =
                emit("onSpeechPartial", firstResult(partialResults))
            override fun onEvent(eventType: Int, params: Bundle?) {}
          })
      val intent =
          Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
          }
      recognizer = r
      r.startListening(intent)
    }
  }

  @ReactMethod fun stop() { main.post { recognizer?.stopListening() } }

  @ReactMethod fun cancel() { main.post { destroyRecognizer() } }

  // Required by NativeEventEmitter.
  @ReactMethod fun addListener(eventName: String) {}

  @ReactMethod fun removeListeners(count: Int) {}

  override fun invalidate() {
    main.post { destroyRecognizer() }
    super.invalidate()
  }
}
