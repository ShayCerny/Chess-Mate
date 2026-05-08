{
  "targets": [{
    "target_name": "chess_engine",
    "sources": [
      "src/addon/chess_engine.cc",
      "src/addon/board.cpp"
    ],
    "include_dirs": [
      "node_modules/node-addon-api"
    ],
    "defines": ["NAPI_CPP_EXCEPTIONS"],
    "conditions": [
      ["OS=='win'", {
        "msvs_settings": {
          "VCCLCompilerTool": {
            "ExceptionHandling": 1,
            "AdditionalOptions": ["/std:c++17"]
          }
        }
      }],
      ["OS=='mac' or OS=='linux'", {
        "cflags_cc": ["-std=c++17", "-fexceptions"],
        "cflags_cc!": ["-fno-exceptions"]
      }]
    ]
  }]
}
