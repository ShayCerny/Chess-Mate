cmake_minimum_required(VERSION 3.14)
project(ChessMateTests CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
FetchContent_Declare(
    Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG        v3.7.1
)
FetchContent_MakeAvailable(Catch2)

add_executable(chess_tests
    board_test.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/../src/addon/board.cpp
)

target_include_directories(chess_tests PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/../src/addon
)

target_link_libraries(chess_tests PRIVATE Catch2::Catch2WithMain)

enable_testing()
add_test(NAME chess_tests COMMAND chess_tests)
