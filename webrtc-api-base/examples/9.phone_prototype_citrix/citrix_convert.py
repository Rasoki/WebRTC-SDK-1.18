#!python3

# To use Citrix API in JsSIP we have to modify JsSIP -
# replace а few standard WebRTC API with Citrix WebRTC API
#
# The script read file to memory as string.
# Script used to convert jssip.js or jssip.min.js or ac_webrtc.min.js
import sys

def findFirst(str, offset, patternList):
    resultIx = -1
    resultPattern = ''
    for pattern in patternList:
        ix = str.find(pattern, offset)
        if ix == -1:
            continue
        if resultIx == -1 or ix < resultIx:
            resultIx = ix
            resultPattern = pattern
    return resultIx, resultPattern   

def findDelimBefore(file, offset, charList):
    searchRange = 100
    beforeOffset = max(offset - searchRange, 0)
    for i in range(offset-1, beforeOffset, -1):
        ch = file[i:i+1]
        for delim in charList:
            if ch == delim:
                return i
    raise Exception('findDelimBefore: cannot find delimiter')                

# Change 'arg1.createAnswer(arg2)' to 'CitrixVdi.createAnswer(arg1, arg2)'
def change(file, ix, find, replace):
    ixDelim = findDelimBefore(file, ix, [' ','?',':', '='])
    ixBeginBracket = file.find('(', ix)
    ixEndBracket = file.find(')', ixBeginBracket)
    arg1 = file[ixDelim+1:ix]
    arg2 = file[ixBeginBracket+1:ixEndBracket]
    result = replace + arg1 + ',' + arg2 + ')'
    return result, ixDelim, ixEndBracket

# read file as single line (important for compressed javascript code)
find = ['new RTCPeerConnection(', '.createOffer(', '.createAnswer(']
replace = ['CitrixVdi.createPeerConnection(', 'CitrixVdi.createOffer(', 'CitrixVdi.createAnswer(']

file = sys.stdin.read()
offset = 0

while True:
    ix, pattern = findFirst(file, offset, find)
    if ix == -1:
        print(file[offset:], end='')          
        break
        
    if pattern == find[0]:
        print(file[offset:ix], end='')
        print(replace[0], end='')
        offset = ix + len(find[0])
        
    elif pattern == find[1]:
        result, ixDelim, ixEndBracket = change(file, ix, find[1], replace[1])
        print(file[offset:ixDelim+1], end='')
        print(result, end='')
        offset = ixEndBracket+1
            
    elif pattern == find[2]:
        result, ixDelim, ixEndBracket = change(file, ix, find[2], replace[2])
        print(file[offset:ixDelim+1], end='')
        print(result, end='')
        offset = ixEndBracket+1