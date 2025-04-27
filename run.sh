#!/bin/bash

set -m
memcached -u nobody &
/usr/src/app/site &
fg %1
