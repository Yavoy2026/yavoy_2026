package com.rork.yavoytravelgroup.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.rork.yavoytravelgroup.data.TravelReel

@Composable
fun ReelsScreen(
    reels: List<TravelReel>,
    onToggleLike: (String) -> Unit,
    onClose: () -> Unit,
) {
    val pagerState = rememberPagerState(pageCount = { reels.size })

    Box(Modifier.fillMaxSize().background(Color.Black)) {
        VerticalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { page ->
            val reel = reels[page]
            Box(Modifier.fillMaxSize()) {
                AsyncImage(
                    model = reel.coverImage,
                    contentDescription = reel.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(0x88000000), Color.Transparent, Color.Transparent, Color(0xDD000000))
                            )
                        )
                )

                // City chip
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = Color(0x33FFFFFF),
                    modifier = Modifier.align(Alignment.TopStart).padding(top = 56.dp, start = 16.dp),
                ) {
                    Text(reel.city, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp))
                }

                // Side actions
                Column(
                    Modifier.align(Alignment.CenterEnd).padding(end = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(18.dp),
                ) {
                    Surface(
                        onClick = { onToggleLike(reel.id) },
                        shape = CircleShape,
                        color = Color(0x44000000),
                        modifier = Modifier.size(52.dp),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                if (reel.likedByMe) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                                null,
                                tint = if (reel.likedByMe) Color(0xFFFF4D6D) else Color.White,
                                modifier = Modifier.size(28.dp),
                            )
                        }
                    }
                    Text(reel.likes, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                // Bottom info
                Column(Modifier.align(Alignment.BottomStart).padding(start = 16.dp, end = 80.dp, bottom = 48.dp)) {
                    Text(reel.author, color = Color(0xCCFFFFFF), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text(reel.title, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(top = 4.dp))
                    Text(reel.tourTitle, color = Color(0xCCFFFFFF), fontSize = 13.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
                    Text(reel.story, color = Color(0xBBFFFFFF), fontSize = 12.sp, lineHeight = 17.sp, modifier = Modifier.padding(top = 6.dp))
                    Row(Modifier.padding(top = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Visibility, null, tint = Color.White, modifier = Modifier.size(12.dp))
                        Text(" ${reel.views} просмотров", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Medium)
                    }
                }
            }
        }

        // Close button
        Surface(
            onClick = onClose,
            shape = CircleShape,
            color = Color(0x66000000),
            modifier = Modifier.align(Alignment.TopEnd).padding(top = 50.dp, end = 16.dp).size(36.dp),
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(Icons.Filled.Close, "Закрыть", tint = Color.White, modifier = Modifier.size(20.dp))
            }
        }
    }
}
