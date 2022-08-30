#!/bin/sh
git add .
git commit -m "bomber update"
git config credential.helper 'cache'
git push
