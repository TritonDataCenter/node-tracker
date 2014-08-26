#pragma D option quiet

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

fbt::zone_status_set:entry
{
  printf("{\"date\":\"%Y\",\"status\":\"%d\",\"name\":\"%s\"}\n",
      walltimestamp, arg1, stringof(((zone_t *)arg0)->zone_name));
}
